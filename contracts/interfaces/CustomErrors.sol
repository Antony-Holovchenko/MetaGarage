// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface CarNFTErrors {
    /**
     * @dev Indicates that user send an incorrect mint fee value.
     * @param passedMintFee Mint fee value that user passed to execute mint function
     * @param reuiredMintFee Mint fee value that should be paid
     * @param minter Address of the user who tries to call a mint function
     */
    error CarNFT_IncorrectMintFeeValue(uint256 passedMintFee, uint256 reuiredMintFee, address minter);

    /**
     * @dev Indicates that user call a tokenURI function for non existent token.
     * @param tokenId Address of the user who tries to call a mint function
     */
    error carNFT_QueryUriForNonExToken(uint256 tokenId);
}

interface CarMarketplaceErrors {
    /**
     * @dev Indicates that user set an invalid price.
     * @param price NFT price in ETH.
     */
    error CarMarketplace_InvalidPriceValue(uint256 price);

    /**
     * @dev Indicates that NFT owner didn't approve marketplace to interract with his NFT.
     */
    error CarMarketplace_MarketplaceNotApproved();

    /**
     * @dev Indicates that NFT is already listed on the marketplace.
     * @param nftAddress address of the NFT contract.
     * @param tokenId ID of the NFT
     */
    error CarMarketplace_NftAlreadyListed(address nftAddress, uint256 tokenId);
    
    /**
     * @dev Indicates that action was triggered not by an owner.
     * @param spender Address of the user, who tries to call a function.
     */
    error CarMarketplace_NotOwner(address spender);

    /**
     * @dev Indicates that NFT wasn't listed yet on the marketplace.
     * @param nftAddress address of the NFT contract.
     * @param tokenId ID of the NFT.
     */
    error CarMarketplace_NftNotListed(address nftAddress, uint256 tokenId);

    /**
     * @dev Indicates that user send not enough money to buy NFT.
     * @param nftAddress address of the NFT contract.
     * @param tokenId ID of the NFT.
     * @param expectedAmount Price of the NFT in ETH.
     * @param givenAmount Amount that user send to buy NFT.
     */
    error CarMarketplace_InvalidPaymentValue(address nftAddress, uint256 tokenId, uint256 expectedAmount, uint256 givenAmount);
   
    /**
     * @dev Indicates that user didn't registered.
     * @param user Address of the user.
     */
    error CarMarketplace_UserNotRegistered(address user);
}