// Common function helpers //
//№1 Receive balance of specific address
const getBal = async(user, provider) => {
    const balance = await ethers.provider.getBalance(user)
    return balance
}

// CarNFT.sol function helpers //
//№1 Minting new nft
const getMintFuncTxReceipt = async(carNft, user1, URI, MINT_FEE) => {
    const txResponse = await carNft.connect(user1).mint(URI, {value: MINT_FEE})
    const txReceipt = await txResponse.wait(1)
    return txReceipt
}

// CarMarketplace.sol function helpers
//№1 Listing new item on the marketplace
const callListItemFunc = async(marketplace, user, carNftContract, tokenID, price) => {
    const txResponse = await marketplace.connect(user).listItem(carNftContract, tokenID, price)
    const txReceipt = await txResponse.wait(1)
    return txReceipt
}

const callBuyItemFunc = async(marketplace, user, carnft, tokenId, priceValue) => {
    const txResponse = await marketplace.connect(user).buyItem(carnft, tokenId, {value: priceValue})
    const txReceipt = await txResponse.wait(1)
    return txReceipt
}

const callCancelItemFunc = async(marketplace, user, carnft, tokenId) => {
    const txResponse = await marketplace.connect(user).cancelListing(carnft, tokenId)
    const txReceipt = await txResponse.wait(1)
    return txReceipt
}

const callUpdItemFunc = async(marketplace, user, carnft, tokenId, priceValue) => {
    const txResponse = await marketplace.connect(user).updateListing(carnft, tokenId, priceValue)
    const txReceipt = await txResponse.wait(1)
    return txReceipt
}



module.exports = { 
    getMintFuncTxReceipt, 
    callListItemFunc, 
    getBal, 
    callBuyItemFunc, 
    callCancelItemFunc,
    callUpdItemFunc
}