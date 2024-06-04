const { network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

module.exports = async({deployments, getNamedAccounts}) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const DECIMALS = 8 // 
    const INITIAL_ANSWER = 200000000000 // at what number the prceFeed is starting

    if (developmentChains.includes(network.name)) {
        console.log(`============ Deploying Mocks on local network ============`)
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        })
        console.log(`Successfully deployed mocks`)
    } 
}

module.exports.tags = ["all", "mocks"]