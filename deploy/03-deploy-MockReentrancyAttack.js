const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async({deployments, getNamedAccounts}) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const marketplaceAddress = (await deployments.get("CarMarketplace")).address
    const carnftAddress = (await deployments.get("CarNFT")).address


    if (developmentChains.includes(network.name)) {
        
        log(`\n============ Deploying Reentrancy Mocks on local network ============\n`)
        
        await deploy("MockReentrancyAttack", {
            from: deployer,
            log: true,
            args: [ marketplaceAddress ]
        })
        
        log(`\n============Successfully deployed reentrancy mocks============\n`)
    } 
}

module.exports.tags = ["all", "mocks", "reentrnacy"]