const { ethers } = require("hardhat")

const mintAndListNft = async() => {
    const URI = "Some uri"
    const MINT_FEE = ethers.parseEther("1")
    const NFT_PRICE = ethers.parseEther("1")
    const marketplaceContract = (await deployments.get("CarMarketplace")).address
    const carnftContract = (await deployments.get("CarNFT")).address
    const carnft = await ethers.getContractAt("CarNFT", carnftContract)
    const marketplace = await ethers.getContractAt("CarMarketplace", marketplaceContract)
    
    console.log("Minting nft")
    const mintTx = await carnft.mint(URI, {value: MINT_FEE})
    await mintTx.wait(1)
    const tokenID = await await carnft.getTotalSupply()
    
    console.log("Approving marketplace")
    const approvalTx = await carnft.approve(marketplaceContract, tokenID)
    await approvalTx.wait(1)

    console.log("Listing nft on marketplace")
    const listingTx = await marketplace.listItem(carnftContract, tokenID, NFT_PRICE)
    await listingTx.wait(1)  

}

mintAndListNft()