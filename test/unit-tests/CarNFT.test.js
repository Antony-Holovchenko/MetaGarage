const { expect } = require("chai")
const { ethers, deployments, network, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config")
const { getMintFuncTxReceipt } = require("../../utils/helpers")

!developmentChains.includes(network.name)
? describe.skip
:describe("CarNFT Tests", function() {
    let contract, carNft, user1, user2, txReceipt
    const URI = "Test URI"
    const MINT_FEE = ethers.parseEther("0.01")
    const WRONG_MINT_FEE = ethers.parseEther("0.001")
    
    beforeEach("Set up a contract for testing", async () => {
        [ ,user1,user2 ] = await ethers.getSigners()

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
    
      describe("Positive Mint function testing", () => {
        beforeEach(async () => {
            txReceipt = await getMintFuncTxReceipt(carNft, user1, URI, MINT_FEE)
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

    }) 

    describe("Negative Mint function testing", () => {
        it("Verify function reverted with IncorrectMintFeeValue error when mint fee is incorrect", async () => {
            const totalSupply = await carNft.s_totalTokenSupply()
            
            await expect(getMintFuncTxReceipt(carNft, user1, URI, WRONG_MINT_FEE)).to.revertedWithCustomError(
                carNft,
                "IncorrectMintFeeValue"
            )
            expect(totalSupply).to.equal(0)
        })
    })

    describe("getTotalSupply function testing", () => {
        it("Should return total tokens supply", async () => {
            await getMintFuncTxReceipt(carNft, user1, URI, MINT_FEE)
            await getMintFuncTxReceipt(carNft, user2, URI, MINT_FEE)
            const totalTokenSupply = await carNft.getTotalSupply()

            expect(totalTokenSupply).to.equal(2);
        })
    })
})