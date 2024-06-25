const { network } = require("hardhat")
const fs = require("fs")

const frontEndContractsFile = "../car-nft-marketplace-frontend/constants/networkMapping.json"

// this script updates the actual smart contract addresses for frontend based on the chain you are
module.exports = async () => {
    if (process.env.UPD_FRONTEND) {
        console.log("Start updating front end")
        const carMarketplaceContractAddress = (await deployments.get("CarMarketplace")).address
        const chainId = network.config.chainId.toString()
        const contractAddressesFrontend =  JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
        //if address for the contract doesn't exist, we create a new one
        if(!contractAddressesFrontend[chainId]["CarMarketplace"].includes(carMarketplaceContractAddress)) {
            contractAddressesFrontend[chainId]["CarMarketplace"].push(carMarketplaceContractAddress)
            console.log("Successfully add new address")
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

module.exports.tags = ["all", "frontend"]