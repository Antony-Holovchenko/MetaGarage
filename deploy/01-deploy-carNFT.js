const { network } = require("hardhat")
const { verify } = require("../utils/verify")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS} = require("../helper-hardhat-config") 

module.exports = async({deployments, getNamedAccounts}) => {
    const { deployer } = await getNamedAccounts()
    const { deploy } = await deployments;
    const mintFee = 0.1
    
    console.log("============ Deploying contract at " + network.name + " network ============")

    const carNFT = await deploy("CarNFT",
    {
        from: deployer,
        log: true,
        args: [mintFee],
        blockConfirmations: developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    })

    console.log("============ Successfully deployed! ============")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) { //check that constract verification only done for testsnet or mainnet, but not for hardhat/localhost network
       await verify(carNFT.address, carNFT.args)
    }

    module.exports.tags = ["all", "carnft"];
}