const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const TOKEN_ID = 2

const cancelItem = async() => {
    const marketplaceContract = (await deployments.get("CarMarketplace")).address
    const marketplace = await ethers.getContractAt("CarMarketplace", marketplaceContract)
    const carnftContract = (await deployments.get("CarNFT")).address

    const tx = await marketplace.cancelListing(carnftContract, TOKEN_ID)
    await tx.wait(1)
    console.log("Listing cancelled!")

    if(network.config.chainId == 31337) {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

cancelItem()