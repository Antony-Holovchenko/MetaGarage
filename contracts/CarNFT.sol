//SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { CarNFTErrors } from "./interfaces/CustomErrors.sol";


contract CarNFT is ERC721URIStorage, Pausable, Ownable, CarNFTErrors{ //inheriting ERC721URIStorage, because this it inherits ERC721 contract with all it functionality
    event CarMinted(
        address indexed minter, 
        uint256 indexed tokenId, 
        string indexed tokenURI
    );

    uint256 public s_totalTokenSupply;
    uint256 public immutable MINT_FEE;

    constructor(uint256 _mintFee) ERC721("MetaGarage", "MG") Ownable(msg.sender) {
        s_totalTokenSupply = 0;
        MINT_FEE = _mintFee;
    }

    /**
     * @dev Function returns a value of 's_totalTokenSupply' - number 
     * of all minted tokens. 
     */
    function getTotalSupply() external view returns(uint256) {
        return s_totalTokenSupply;
    }  
    
    /**
     * @dev Function for pause the contract. Means we
     * can pause the contract in case of "attack" for example and 
     * and "mint" function won't work when the contract is paused.
     */
    function pauseContract() private onlyOwner {
        _pause();
    }

    /**
     * @dev Function for unpause the contract. Means we
     * can unpause the contract once the problem will be solved, and 
     * and "mint" function will work again.
     */
    function unpauseContract() private onlyOwner {
        _unpause();
    }

    /**
     * @dev Function for cahnging ownership over the contract.
     * @param newOwner - address of the new contract owner.
     */
    function changeOwnership(address newOwner) private {
        transferOwnership(newOwner);
    }

    /**
     * @dev Mints new car nft and set up a token URI. 
     * Minter, should pay a mint fee to create new nft.
     * If mint fee is < MINT_FEE, then function will be reverted with
     * "IncorrectMintFeeValue" error. Function returns an id of created token.
     * 
     * @param tokenURI - a URI that points to token metadata, that is stored off-chain. 
     */
    function mint(string memory tokenURI) 
        public 
        payable 
        whenNotPaused
        returns(uint256) 
    {
        uint256 value = msg.value;
        address minter = msg.sender;
        if(value < MINT_FEE) {
            revert CarNFT_IncorrectMintFeeValue(value, MINT_FEE, minter);
        }
        
        uint256 tokenId = s_totalTokenSupply += 1;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        uint256 refund = value - MINT_FEE;
        if (refund > 0) {
            payable(minter).transfer(refund);
        } 

        emit CarMinted(msg.sender, tokenId, tokenURI);            
        return tokenId;
    }
}