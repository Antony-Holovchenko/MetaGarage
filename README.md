# Car marketplace NFT Dapp
NFT platform for buying and selling car NFTs. This is an example project, and it can be 
impoved with additional features. In this repository you'll find my usage of the 
ERC721 standard with the help of which everyone can create a non fungible car NFTs, and then 
list/buy/update/cancel them on the marketplace. 

## Technology Stack & Tools

- Solidity (Writing Smart Contracts)
- Javascript (Testing/Scripting)
- [Hardhat](https://hardhat.org/) (Development Framework)
- [Ethers.js](https://docs.ethers.io/v5/) (Blockchain Interaction)
- [Mocha](https://www.npmjs.com/package/mocha) (Testing Framework)

## Requirements For Initial Setup
- Install [NodeJS](https://nodejs.org/en/)

## Setting Up The Project
### 1. Clone/Download the Repository
`https://github.com/Antony-Holovchenko/MetaGarage.git`

### 2. Install Dependencies:
`$ npm install`

### 3. Run tests
`$ npm run ht`

### 5. Run deployment script
In a separate terminal execute:
`$ npm run hd --"network"`

### 4. Start Hardhat node(localhost)
`$ npx hardhat node`

### 5. Once localhost is running, try to interract with the scripts
In a separate terminal execute:
`$ npx hardhat run scripts/<script-name> --"network"`
