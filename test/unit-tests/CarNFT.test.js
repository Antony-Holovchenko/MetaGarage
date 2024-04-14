const { expect } = require("chai")
const { ethers, deployments, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config")
const { getMintFuncTxReceipt } = require("../../utils/helpers")

!developmentChains.includes(network.name)
? describe.skip
:describe("CarNFT Tests", function() {
    let contract, carNft, user1, user2, deployer, txReceipt, userBalanceBeforeMinting
    const provider = ethers.provider
    const URI = "Test URI"
    const MINT_FEE = ethers.parseEther("1") // Mint fee which = to specified mint fee during deployment
    const GREATER_MINT_FEE = ethers.parseEther("2") // Mint fee which is greater that specified mint fee during deployment(for testing)
    const WRONG_MINT_FEE = ethers.parseEther("0.5") // Mint fee which is less than specified mint fee during deployment(for testing)
    
    beforeEach("Set up a contract for testing", async () => {
        [ deployer, user1, user2 ] = await ethers.getSigners()

        //deploy contract for tests
        await deployments.fixture(["carnft"]) // take a deploy script with "carnft" tag and deploy it
        contract = (await deployments.get("CarNFT")).address; //receive a depoyed contract information(means address, ABI, bytecode ...)
        carNft = await ethers.getContractAt("CarNFT", contract) //receive a contract instance
    })

    describe("Constructor testing", () => {
        it("Verify a successful CarNFT contract initialization", async () => {
            const name = await carNft.name()
            const symbol = await carNft.symbol()
            const totalTokenSupply = await carNft.s_totalTokenSupply()
            const mintFee = await carNft.MINT_FEE()

            expect(name).to.equal("MetaGarage")
            expect(symbol).to.equal("MG")
            expect(totalTokenSupply).to.equal(0)
            expect(mintFee).to.equal(MINT_FEE) 
        })
    
    })
    
      describe("Positive mint function testing", () => {
        beforeEach(async () => {
            userBalanceBeforeMinting = await provider.getBalance(user1.address)
            txReceipt = await getMintFuncTxReceipt(carNft, user1, URI, GREATER_MINT_FEE) // sending a greated mint fee that needed, to test mechanism of refund rest of the value to user
        })

        it("Verify a successfull nft minting", async () => {
            const totalSupply = await carNft.s_totalTokenSupply()
            const userTokenURI = await carNft.tokenURI(1)
            const from = ethers.ZeroAddress

            expect(totalSupply).to.equal(1)
            expect(userTokenURI).to.equal(URI) 
            await expect(txReceipt).to.emit(carNft, "CarMinted").withArgs(user1, totalSupply, URI)
            await expect(txReceipt).to.emit(carNft, "Transfer").withArgs(from, user1, totalSupply)
            await expect(txReceipt).to.emit(carNft, "MetadataUpdate").withArgs(totalSupply)
        })
        
        it("Verify we can track owner of the nft", async () => {
            const owner = await carNft.ownerOf(1)
            expect(user1).to.equal(owner)
        })

        it("Verify we can track balance of the nft owner", async () => {
            const userBalance = await carNft.balanceOf(user1) 
            expect(userBalance).to.equal(1)
        }) 

        it("Verify if user send mint fee > than required, then the rest of his sent value should be returned", async () => {
            const gasSpent = txReceipt.gasUsed * txReceipt.gasPrice
            const userBalanceAfterMinting = await provider.getBalance(user1.address)
            const expectedUserBalanceAfterMinting = userBalanceBeforeMinting - (MINT_FEE + gasSpent)
            const expectedContractBalance = MINT_FEE // balance of the contract = MINT_FEE, because during the deployment MINT_FEE is set to 1 ether
            const actualContractBalance = await provider.getBalance(txReceipt.to)
            
            expect(userBalanceAfterMinting).to.equal(expectedUserBalanceAfterMinting) // use ethers.formatEther(<value in wei>) if u want to compare ether values instead of wei
            expect(actualContractBalance).to.equal(expectedContractBalance) // verifying that contract should be funded only with MINT_FEE value specified in the smart contract, no less, no more
        })

    }) 

    describe("Negative mint function testing", () => {
        it("Verify mint function reverted with CarNFT_IncorrectMintFeeValue error when mint fee is incorrect", async () => {
            const totalSupply = await carNft.s_totalTokenSupply()
            
            await expect(getMintFuncTxReceipt(carNft, user1, URI, WRONG_MINT_FEE)).to.revertedWithCustomError(
                carNft,
                "CarNFT_IncorrectMintFeeValue"
            )
            expect(totalSupply).to.equal(0)
        })
    })

    // These tests are commented, because related functions in the contract have 
    // a "private" visibility modifier. These functions are tested and working as expected.
    // If you want to run these tests --> change visibility modifier for these functions to "public",
    // and run the tests.  
    /* describe("Pausable mechanism testing", () => {
        it("Verify mint function is reverted with EnforcedPause error when contract is paused", async () => {
            await carNft.connect(deployer).pauseContract() 
            const isPaused = await carNft.paused()
            
            await expect(getMintFuncTxReceipt(carNft, user1, URI, MINT_FEE)).to.revertedWithCustomError(
                carNft,
                "EnforcedPause"
            )
            expect(isPaused).to.be.true
        })

        it("Verify mint function should work when contract is unpaused", async () => {
            await carNft.connect(deployer).pauseContract() 
            let isPaused = await carNft.paused()
    
            expect(isPaused).to.be.true
    
            await carNft.connect(deployer).unpauseContract()
            await getMintFuncTxReceipt(carNft, user1, URI, MINT_FEE)
            isPaused = await carNft.paused()
           
            expect(await carNft.balanceOf(user1)).to.equal(1)
            expect(isPaused).to.be.false
        })

        it("Verify only contract owner can call pauseContract, unpauseContract functions", async () => {
            await expect(carNft.connect(user1).pauseContract()).to.be.revertedWithCustomError(
                carNft,
                'OwnableUnauthorizedAccount'
            )
            
            await expect(carNft.connect(user1).unpauseContract()).to.be.revertedWithCustomError(
                carNft,
                'OwnableUnauthorizedAccount'
            )
        })
    })

    describe("changeOwnership functoin testing", () => {
        it("Verify contract owner can successfully set up a new owner", async () => {
            await carNft.connect(deployer).changeOwnership(user2)
            const contractOwner = await carNft.owner()
            
            expect(contractOwner).to.equal(user2)
        })

        it("Verify functoin should be reverted when not a contract owner call it", async () => {
            expect(carNft.connect(user2).changeOwnership(user1)).to.be.revertedWithCustomError(
                carNft,
                'OwnableUnauthorizedAccount'
            )
            const contractOwner = await carNft.owner()

            expect(contractOwner).to.equal(deployer) // deployer - is an address which deploys contract in the deploy script
        })
    }) */

    describe("getTotalSupply function testing", () => {
        it("Should return total tokens supply", async () => {
            await getMintFuncTxReceipt(carNft, user1, URI, MINT_FEE)
            await getMintFuncTxReceipt(carNft, user2, URI, MINT_FEE)
            const totalTokenSupply = await carNft.getTotalSupply()

            expect(totalTokenSupply).to.equal(2);
        })
    })
})