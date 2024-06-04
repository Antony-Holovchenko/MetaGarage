//SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import { CarMarketplaceErrors } from "./interfaces/CustomErrors.sol";


// "list" new car nft item +
// "buy" car nft item +
// "cancel" listing of your nft +
// "update" listed nft 
// "withdraw", if you sell an nft item, then you can withdraw money from the marketplace

contract CarMarketplace is ReentrancyGuard, CarMarketplaceErrors {
    //apply our library functions for uint256
    using PriceConverter for uint256;
    
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed seller,
        address indexed buyer,
        uint256 indexed tokenId,
        address nftAddress,
        uint256 price
    );

    event ItemCancelled(
        address indexed owner,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    event ItemUpdated(
        address indexed owner,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 newPrice
    );

    event Withdrowal(
        uint256 amount,
        address receiver
    );

    // This struct helps to track each item in the "s_listings"
    struct ListedItem {
        uint256 priceInEth;
        uint256 priceInUsd;
        address seller;
    }
    AggregatorV3Interface private s_priceFeed;

    //NFT contract address --> NFT tokenId --> ListedItem | this mapping store all listed items on the marketplace
    mapping(address => mapping(uint256 => ListedItem)) private s_listings;
    mapping(address => uint256) private s_withdrawBalance;

    /**
     * @dev This modifier checks if the item is not yet listed on the Marketplace.
     * If the price of the item is < 0, then item is not yet listed on the Marketplace and modifier check pass. 
     * Otherwise if price is > 0, revert the transaction with "NftAlreadyListed" error.
     * 
     * @param nftAddress - address of the nft contract.
     * @param tokenId - identifier of the specific token.
     */
    modifier notListed(address nftAddress, uint256 tokenId) {
        ListedItem memory item = s_listings[nftAddress][tokenId];
        if(item.priceInEth > 0 && item.priceInUsd > 0) {
            revert CarMarketplace_NftAlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    /**
     * @dev This modifier checks if the item is listed on the Marketplace.
     * If the price of the item is > 0, then item is already listed on the Marketplace 
     * and modifier check pass. Otherwise if price is < 0, 
     * revert the transaction with "NftNotListed" error.
     * 
     * @param nftAddress - address of the nft contract.
     * @param tokenId - identifier of the specific token.
     */
    modifier isListed(address nftAddress, uint256 tokenId) {
        ListedItem memory item = s_listings[nftAddress][tokenId];
        if(item.priceInEth < 0 && item.priceInUsd < 0) {
            revert CarMarketplace_NftNotListed(nftAddress, tokenId);
        }
        _;
    }

    /**
     * @dev This modifier checks that only the token owner can list a related item under the "tokenId" 
     * on the Marketplace. If "spender" == token owner, then modifier check pass.
     * Otherwise if "spender" != token owner, transaction will be reverted with "NotOwner" error.
     * 
     * @param nftAddress - address of the nft contract.
     * @param tokenId - identifier of the specific token.
     */
    modifier isOwner(
        address nftAddress, 
        uint256 tokenId,
        address spender
    ) 
    {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert CarMarketplace_NotOwner(spender);
        }
        _;
    }
    
    constructor(AggregatorV3Interface priceFeed) {
        s_priceFeed = priceFeed;
    }

    /**
     * @dev - Function returns listed item on the marketplace.
     * 
     * @param _nftAddress - address of the nft contract.
     * @param _tokenId - unique identifier of the specific token.
     */
    function getListedItem(
        address _nftAddress, 
        uint256 _tokenId
    ) 
        external 
        view
        returns (ListedItem memory)
    {
        return s_listings[_nftAddress][_tokenId];
    } 

    /**
     * @dev - Function returns available user balance. the he/she can ask to withdraw. 
     * 
     * @param owner - cryptocurrency owner address.
     */
    function getWithdrawBalance(address owner) 
        external 
        view 
        returns(uint256) 
    {
        return s_withdrawBalance[owner];
    }
    
    /**
     * @dev This function perform a listig of a new nft on the marketplace. 
     * Nft item shouldn't be listed yet. Only token owner can list NFT item 
     * and the person who wants to list nft should already have a connected wallet in app.
     * Ownership will still belongs to the nft owner, and owner will approve marketplace 
     * to sell his nfts. 
     * 
     * @param _nftAddress - address of the nft contract .
     * @param _tokenId - unique identifier of the specific token.
     * @param _priceInEth - price of the listed item(nft).
     *
     * Emits {ItemListed} event.
     */
    function listItem(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _priceInEth
    ) 
        external 
        notListed(_nftAddress, _tokenId) //make sure nft not lister yet
        isOwner(_nftAddress, _tokenId, msg.sender) //make sure that only nft owner can list nft
    {
        if(_priceInEth <= 0){
            revert CarMarketplace_InvalidPriceValue(_priceInEth);
        } 
         //check that Marketplace is approved to transfer token to another account in the future
        IERC721 nft = IERC721(_nftAddress);
        if (nft.getApproved(_tokenId) != address(this)) { //getApproved() - returns approved account that can interract with 'tokenID'
            revert CarMarketplace_MarketplaceNotApproved();
        }
        s_listings[_nftAddress][_tokenId] = ListedItem({ //add new listed item
            priceInEth: _priceInEth,
            priceInUsd: convertEthToUsd(_priceInEth),
            seller: msg.sender
        });

        emit ItemListed(msg.sender, _nftAddress, _tokenId, _priceInEth);
    }

    /**
     * @dev Function implements a purchase process of the nft. 
     * A "nonReentrant" modifier checks if the function is already in a reentrant call or no(in this way we prevent a reentrancy attack). 
     * Buyer should send enough money to buy an item, otherwise transaction will be reverted with "InvalidPaymentValue" error. 
     * Update "s_withdrawBalance"of the "seller". Transfer ownership from "seller" to "buyer".
     * 
     * @param _nftAddress - address of the nft contract.
     * @param _tokenId - unique identifier of the specific token.
     * 
     * Emits {ItemBought} event.
     */
    function buyItem(
        address _nftAddress, 
        uint256 _tokenId
    ) 
        external 
        payable  
        nonReentrant
        isListed(_nftAddress, _tokenId)
    {
        ListedItem memory item = s_listings[_nftAddress][_tokenId];
        if(msg.value != item.priceInEth) { //make sure user will sent enough money first
            revert CarMarketplace_InvalidPaymentValue(_nftAddress, _tokenId, item.priceInEth, msg.value);
        }
            
        s_withdrawBalance[item.seller] += msg.value;
        delete(item); //once we sell listed Item we should delete it
        IERC721(_nftAddress).transferFrom(item.seller, msg.sender, _tokenId);

        emit ItemBought(item.seller, msg.sender, _tokenId, _nftAddress, item.priceInEth);
    }

    /**
     * @dev - Function will cancel item listing on the marketplace(remove 
     * item from marketplace). Only item(nft) owner can do this operation.
     * Item should be already listed, to cancel listing. 
     * 
     * @param _nftAddress - address of the nft contract.
     * @param _tokenId - id of the token, that can be bought.
     * 
     * Emits {ItemCancelled} event.
     */
    function cancelListing(
        address _nftAddress, 
        uint256 _tokenId
    ) 
    external 
    isOwner(_nftAddress, _tokenId, msg.sender)
    isListed(_nftAddress, _tokenId) 
    {
        delete s_listings[_nftAddress][_tokenId];

        emit ItemCancelled(msg.sender ,_nftAddress, _tokenId);
    }

    /**
     * @dev Function will update the price of the listed item(nft). 
     * Only nft owner can update a related listing. Item should be 
     * already listed, to make an update. 
     *  
     * 
     * @param _nftAddress - address of the nft contract.
     * @param _tokenId - unique identifier of the specific token.
     * @param _newPriceInEth  - new price value of the listed item(nft) in Ether.
     * 
     * Emits {ItemUpdated} event
     */
    function updateListing(
        address _nftAddress, 
        uint256 _tokenId,
        uint256 _newPriceInEth
    ) 
        external 
        isOwner(_nftAddress, _tokenId, msg.sender)
        isListed(_nftAddress, _tokenId) 
    {
        s_listings[_nftAddress][_tokenId].priceInEth = _newPriceInEth;
        s_listings[_nftAddress][_tokenId].priceInUsd = convertEthToUsd(_newPriceInEth);

        emit ItemUpdated(msg.sender, _nftAddress, _tokenId, _newPriceInEth);
    }

    /**
     * @dev This function will send a balance amount to balance owner.
     * Transfer process canbe done only if "s_withdrawBalance" of the user is > 0.
     * 
     * Emits {Withdrawal} event.
     */
    function withdrawBalance() external {
        address user = msg.sender;
        uint256 amount = s_withdrawBalance[user];
        require(s_withdrawBalance[user] > 0, "Nothing to withdraw");
        
        s_withdrawBalance[user] = 0;
        (bool success, ) = payable(user).call{value: amount}("");
        require(success, "Transaction failed");

        emit Withdrowal(amount, user);
    }

    /**
     * @dev Function converts cryptocurrency '_amount'in USD.
     * 
     * @param _amount - amount of cryptocurrency that will be converted to USD
     */
    function convertEthToUsd(uint256 _amount) 
        internal 
        view 
        returns(uint256)
    {
       require(_amount != 0, "Amount value < 0");
       return _amount.getConvertedPrice(s_priceFeed);
    }
}