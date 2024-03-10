//SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// "list" new car nft item +
// "buy" car nft item +
// "cancel" listing of your nft +
// "update" listed nft 
// "withdraw", if you sell an nft item, then you can withdraw money from the marketplace

contract CarMarketplace is ReentrancyGuard {
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

    error InvalidPriceValue(uint256 price);
    error MarketplaceNotApproved();
    error NftAlreadyListed(address nftAddress, uint256 tokenId);
    error NotOwner(address spender);
    error NftNotListed(address nftAddress, uint256 tokenId);
    error InvalidPaymentValue(address nftAddress, uint256 tokenId, ListedItem item);
    error UserNotRegistered(address user);

    // This struct helps to track each item in the "s_listings"
    struct ListedItem {
        uint256 price;
        address seller;
    }

    //NFT contract address --> NFT tokenId --> ListedItem | this mapping store all listed items on the marketplace
    mapping(address => mapping(uint256 => ListedItem)) private s_listings;
    mapping(address => uint256) private s_withdrawBalance;
    mapping(address => bool) private s_registeredUsers;

    /**
     * @dev This modifier checks that 
     * user connected his wallet to application.
     * Means user should be registered 
     */
    modifier onlyRegistered(address user) {
        if(!s_registeredUsers[user]) {
            revert UserNotRegistered(user);
        }
        _;
    }

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
        if(item.price > 0) {
            revert NftAlreadyListed(nftAddress, tokenId);
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
        if(item.price < 0) {
            revert NftNotListed(nftAddress, tokenId);
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
            revert NotOwner(spender);
        }
        _;
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
    function getWithdrawBalance(address owner) external view returns(uint256) {
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
     * @param _price - price of the listed item(nft).
     *
     * Emits {ItemListed} event.
     */
    function listItem(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _price
    ) 
        external 
        notListed(_nftAddress, _tokenId) //make sure nft not lister yet
        isOwner(_nftAddress, _tokenId, msg.sender) //make sure that only nft owner can list nft
        onlyRegistered(msg.sender) //make sure user connected his wallet in app
    {
        if(_price <= 0){
            revert InvalidPriceValue(_price);
        } 
         //check that Marketplace is approved to transfer token to another account in the future
        IERC721 nft = IERC721(_nftAddress);
        if (nft.getApproved(_tokenId) != address(this)) { //getApproved() - returns approved account that can interract with 'tokenID'
            revert MarketplaceNotApproved();
        }
        s_listings[_nftAddress][_tokenId] = ListedItem({ //add new listed item
            price: _price,
            seller: msg.sender
        });

        emit ItemListed(msg.sender, _nftAddress, _tokenId, _price);
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
        onlyRegistered(msg.sender) 
    {
        ListedItem memory item = s_listings[_nftAddress][_tokenId];
        if(msg.value != item.price) { //make sure user will sent enough money first
            revert InvalidPaymentValue(_nftAddress, _tokenId, item);
        }
            
        s_withdrawBalance[item.seller] += msg.value;
        delete(s_listings[_nftAddress][_tokenId]); //once we sell listed Item we should delete it
        IERC721(_nftAddress).transferFrom(item.seller, msg.sender, _tokenId);

        emit ItemBought(item.seller, msg.sender, _tokenId, _nftAddress, item.price);
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
     * @param _newPrice  - new price value of the listed item(nft).
     * 
     * Emits {ItemUpdated} event
     */
    function updateListing(
        address _nftAddress, 
        uint256 _tokenId,
        uint256 _newPrice
    ) 
        external 
        isOwner(_nftAddress, _tokenId, msg.sender)
        isListed(_nftAddress, _tokenId) 
    {
        s_listings[_nftAddress][_tokenId].price = _newPrice;

        emit ItemUpdated(msg.sender, _nftAddress, _tokenId, _newPrice);
    }

    /**
     * @dev This function will send a balance amount to balance owner.
     *  Transfer process canbe done only if "s_withdrawBalance" of the user is > 0.
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
}