const { network } = require("hardhat")
const { verify } = require("../utils/verify")
const { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains } = require("../helper-hardhat-config")
const { BigNumber } = require("bignumber.js")

module.exports = async({deployments, getNamedAccounts}) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const mintFee = new BigNumber(0.01).times(1e18).toFixed(0) //0.01 ETH; toFixed() - converts value to a string with zero decimal place

    log("============ Deploying contract on " + network.name + " network ============")

    const carnft = await deploy("CarNFT", {
            from: deployer,
            log: true,
            args: [mintFee],
            blockConfirmations: developmentChains.includes(network.name)
            ? 1
            : VERIFICATION_BLOCK_CONFIRMATIONS
    })  

    log("============ Successfully deployed! ============")  

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(carnft.address, carnft.args)
    }
} 


module.exports.tags = ["all", "carnft"]