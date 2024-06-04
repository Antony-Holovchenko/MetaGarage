const { expect } = require("chai")
const { ethers, deployments, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
? describe.skip
: describe("Car Marketplace Tests", function () {
    let deployer, user1, marketplace, marketplaceContract, carnft, carnftContract
    const URI = "Test Uri"
    const MINT_FEE = ethers.parseEther("1")
    const PRICE = ethers.parseEther("0.5")

    beforeEach("Set up contract for testing", async() => {
        [deployer, user1] = await ethers.getSigners()
        
        await deployments.fixture(["all"])
        marketplaceContract = (await deployments.get("CarMarketplace")).address
        marketplace = await ethers.getContractAt("CarMarketplace", marketplaceContract)
        // receive carnft token address
        carnftContract = (await deployments.get("CarNFT")).address
        carnft = await ethers.getContractAt("CarNFT", carnftContract)
        await carnft.connect(user1).mint(URI, {value: MINT_FEE})
        await carnft.connect(user1).approve(marketplaceContract, 1)
    })

    /* describe("Testing Marketplce constructor initialization", () => {
        // Comment this test, because of the private variable. 
        // This test is only working if change the s_priceFeed variable to public.
        // In contract it is set as private. This test successfully passing.
        it("Successfully initialize Marketplace contract", async () => {
            const priceFeed = await marketplace.s_priceFeed()
            const expectedPriceFeed = "0x0000000000000000000000000000000000000000"
            expect(priceFeed).to.equal(expectedPriceFeed)
        })
    }) */

    describe("ListItem function testing", () => {
        it.only("Successfully list new item on the marketplace", async() => {
            const listedItem = await marketplace.connect(user1).listItem(carnftContract, 1 ,PRICE)
            
        })
    })
})
