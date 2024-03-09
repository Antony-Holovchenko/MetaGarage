const { network } = require("hardhat")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async({deployments, getNamedAccounts}) => {
  const { deployer } = await getNamedAccounts() //accessed 1st account(deployer) in the config file
  const { deploy } = deployments

  console.log("============ Deploying contract at " + network.name + " network ============")
  
  const marketplace = await deploy("CarMarketplace", {
    from: deployer,
    log: true,
    args: [],
    blockConfirmations: developmentChains.includes(network.name) 
    ? 1 
    : VERIFICATION_BLOCK_CONFIRMATIONS
  })
  
  console.log("============ Successfully deployed! ============")
  
  if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(marketplace.address, marketplace.args)
  }
}

module.exports.tags = ["all", "marketplace"];