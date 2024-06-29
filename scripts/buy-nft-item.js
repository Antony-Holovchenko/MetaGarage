const { ethers, network } = require("hardhat")
const { moveBlocks }  = require("../utils/move-blocks")

const TOKEN_ID = 1

const buyItem = async() => {
    const marketplaceContract = (await deployments.get("CarMarketplace")).address
    const marketplace = await ethers.getContractAt("CarMarketplace", marketplaceContract)
    const carnftContract = (await deployments.get("CarNFT")).address
    const listing = await marketplace.getListedItem(carnftContract, TOKEN_ID)
    const price = await listing.priceInEth.toString()
      
    const tx = await marketplace.buyItem(carnftContract, TOKEN_ID, {value: price})
    await tx.wait(1)
    console.log("Successfully bought NFT!")

    if(network.config.chainId == 31337) {
        await moveBlocks(2, (sleepAmount = 1000))
    } 
}

buyItem()