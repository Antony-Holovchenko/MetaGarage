require("hardhat-deploy")
require("dotenv").config()
require("@nomicfoundation/hardhat-verify")
require("@nomicfoundation/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")


module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
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
        version: "0.8.24"
      }
    ]
  }
}
