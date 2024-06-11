const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async({deployments, getNamedAccounts}) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const DECIMALS = "8" 
    const INITIAL_ANSWER = "200000000000" // at what number the prceFeed is starting

    if (developmentChains.includes(network.name)) {
        
        log(`\n============ Deploying Mocks on local network ============\n`)
        
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        })
        
        log(`\n============Successfully deployed mocks============\n`)
    } 
}

module.exports.tags = ["all", "mocks"]