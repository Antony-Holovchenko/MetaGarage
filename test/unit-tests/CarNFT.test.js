const { assert, expect } = require('chai');
const { ethers } = require('hardhat');

describe("CarNFT", () => {
    let carnft
    let user1, user2
    let URI = "Test URI"

    beforeEach(async () => {
        //set a user status deployer address
        [user1, user2] = await ethers.getSigners()

        const CarNFT = await ethers.getContractFactory("CarNFT")
        carnft = await CarNFT.deploy()
    
    })

    describe("Constructor testing", () => {
        
        it("Successfully deploy a CarNFT contract", async () => {
            expect(await carnft.name()).to.equal("CryptoWheels")
            expect(await carnft.symbol()).to.equal("CWS")
        })
    
    })

    describe("Mint function testing", () => {
        it("Should mint nft and track it", async () => {
            await carnft.connect(user1).mint(URI)
            console.log("New car nft is minted");
            expect(await carnft.totalTokenSupply()).to.equal(1)
            expect(await carnft.tokenURI(1)).to.equal(URI)

            //check the 2nd user mints nft
            await carnft.connect(user2).mint(URI)
            expect(await carnft.totalTokenSupply()).to.equal(2)
            expect(await carnft.tokenURI(2)).to.equal(URI) 
        })

    })

    /* describe("Total supply function testing", async () => {

    }) */
})