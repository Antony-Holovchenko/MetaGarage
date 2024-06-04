const { network } = require("hardhat")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async({deployments, getNamedAccounts}) => {
  const { deployer } = await getNamedAccounts() //accessed 1st account(deployer) in the config file
  const { deploy, log } = deployments
  const chainId = network.config.chainId 
  let priceFeedAddress

  // based on which network we are, deploy script will automatically set the correct priceFeedAddress
  if (developmentChains.includes(network.name)) {
    priceFeedAddress = (await deployments.get("MockV3Aggregator")).address
  } else {
    priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }

  console.log(`\n============ Deploying CarMarketplace on ${network.name}  network ============\n`)
  
  const marketplace = await deploy("CarMarketplace", {
    from: deployer,
    log: true,
    args: [priceFeedAddress],
    blockConfirmations: developmentChains.includes(network.name) 
    ? 1 
    : VERIFICATION_BLOCK_CONFIRMATIONS
  })
  
  console.log(`\n============ Successfully deployed! ============\n`)
  
  if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(marketplace.address, marketplace.args)
  }
}

module.exports.tags = ["all", "marketplace"];