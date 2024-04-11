// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface CarNFTErrors {
    /**
     * @dev Error that indicates that user send an incorrect mint fee value.
     * @param passedMintFee Mint fee value that user passed to execute mint function
     * @param reuiredMintFee Mint fee value that should be paid
     * @param minter Address of the user who tries to call a mint function
     */
    error CarNFT_IncorrectMintFeeValue(uint256 passedMintFee, uint256 reuiredMintFee, address minter);
}