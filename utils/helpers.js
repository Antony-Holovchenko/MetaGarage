const getMintFuncTxReceipt = async(carNft, user1, URI, MINT_FEE) => {
    const txResponse = await carNft.connect(user1).mint(URI, {value: MINT_FEE})
    const txReceipt = await txResponse.wait()
    return txReceipt
}

module.exports = { getMintFuncTxReceipt }