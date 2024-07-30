require("hardhat-deploy")
require("dotenv").config()
require("@nomicfoundation/hardhat-verify")
require("@nomicfoundation/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")
require('solidity-coverage')
require("@chainlink/env-enc").config();


/*
1) Please don't forget to configure your .env file
with SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY.
So that you will be able to launch, test, interract with the project.
*/ 
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmations: 6
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    user1: {
      default: 1
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.26"
      }
    ]
  }
}
