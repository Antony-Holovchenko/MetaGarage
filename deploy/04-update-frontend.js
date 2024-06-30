const { ethers, deployments, network } = require("hardhat")
const fs = require("fs")
require("dotenv").config()

const frontEndContractsFile = "../car-nft-marketplace-frontend/constants/networkMapping.json"
const frontEndAbiLocation = "../car-nft-marketplace-frontend/constants/"

// this script updates the actual smart contract addresses for frontend based on the chain you are
async function updateContractAddressesForFrontend() {
    console.log("Updating smart contracts addresses...")
    if (process.env.UPD_FRONTEND) {
        const carMarketplaceContractAddress = (await deployments.get("CarMarketplace")).address
        const chainId = network.config.chainId.toString()
        const contractAddressesFrontend =  JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
        //if address for the contract doesn't exist, we create a new one
        if(chainId in contractAddressesFrontend) {
            if(!contractAddressesFrontend[chainId]["CarMarketplace"].includes(carMarketplaceContractAddress)) {
                contractAddressesFrontend[chainId]["CarMarketplace"].push(carMarketplaceContractAddress)
                console.log("Successfully add new address")
            }
        } else {
            // if exists, we update it
            contractAddressesFrontend[chainId]["CarMarketplace"] = {
                "CarMarketplace": [carMarketplaceContractAddress]
            }
            console.log("Successfully update address")
        }
        fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddressesFrontend))
    }
}

async function updateAbi() {
    console.log("Updating ABIs...")
    const carMarketplaceAbi = (await deployments.get("CarMarketplace")).abi
    const carMarketplaceInterface = new ethers.Interface(carMarketplaceAbi)
    fs.writeFileSync(
        `${frontEndAbiLocation}carMarketplace.json`,
        JSON.stringify(carMarketplaceInterface)    
    )

    const carNftAbi = (await deployments.get("CarNFT")).abi
    const carNftInterface = new ethers.Interface(carNftAbi)
    fs.writeFileSync(
        `${frontEndAbiLocation}carNft.json`,
        JSON.stringify(carNftInterface)    
    )
}
module.exports = async function() {
    if(process.env.UPD_FRONTEND) {
        console.log("Start updating front end")
        await updateContractAddressesForFrontend()
        await updateAbi()
    }
 }
module.exports.tags = ["all", "frontend"]