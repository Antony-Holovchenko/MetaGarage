require("hardhat-deploy")
require("dotenv").config()
require("@nomicfoundation/hardhat-verify")
require("@nomicfoundation/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ||
"https://eth-sepolia.g.alchemy.com/v2/NqoJF8sEpupebeYO6XSfyJlMk8QdENkj"

const PRIVATE_KEY = process.env.PRIVATE_KEY ||
"224950909caa03b26b8b80d354b4fdb50cc623418d256858b1000da7a58a5487"

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 
"WJW56NEU53EGYACFRQI63B69FYG2PV4K1H"



module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
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
      sepolia: "ETHERSCAN_API_KEY"
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
