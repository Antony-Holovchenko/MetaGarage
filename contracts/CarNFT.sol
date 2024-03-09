//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CarNFT is ERC721URIStorage { //inheriting ERC721URIStorage, because this it inherits ERC721 contract with all it functionality
    event CarMinted(
        address indexed owner, 
        uint256 indexed tokenId, 
        string indexed tokenURI
    );

    error IncorrectMintFeeValue(uint256 mintFee, address minter);
    
    uint256 public s_totalTokenSupply;
    uint256 public immutable MINT_FEE;

    constructor(uint256 _mintFee) ERC721("CryptoWheels", "CWS"){
        s_totalTokenSupply = 0;
        MINT_FEE = _mintFee;
    }

    /**
     * @dev Function returns a value of 's_totalTokenSupply' - number 
     * of all minted tokens. 
     */
    function getTotalSupply() public view returns(uint256) {
        return s_totalTokenSupply;
    }  
    
    /**
     * @dev Mints new car nft and set up a token URI. 
     * Minter, should pay a mint fee to create new nft.
     * If mint fee is < MINT_FEE, then function will be reverted with
     * "IncorrectMintFeeValue" error. Function returns an id of created token.
     * 
     * @param tokenURI - a URI that points to token metadata, that is stored off-chain. 
     */
    function mint(string calldata tokenURI) 
        public 
        payable 
        returns(uint256) 
        {
            if(msg.value < MINT_FEE) {
                revert IncorrectMintFeeValue(msg.value, msg.sender);
            }
            uint256 tokenId = s_totalTokenSupply += 1;
            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, tokenURI);

            emit CarMinted(msg.sender, s_totalTokenSupply, tokenURI);
            
            return tokenId;
    }
}


