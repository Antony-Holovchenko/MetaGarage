// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed) 
        internal 
        view 
        returns(uint256) 
    {
        (,int256 answer,,,) = priceFeed.latestRoundData();
        return uint(answer * 1e10); //Chainlink price feeds returns price data with 8 decimal places. After * price by 10 we'll receive 18 decimal places
    }

    function getConvertedPrice
    (
        uint256 amount, 
        AggregatorV3Interface priceFeed
    ) 
        internal 
        view 
        returns(uint256) 
    {
        uint256 priceInUsdPerCoin = getPrice(priceFeed); //receive current price per 1 coin
        uint256 totalPriceInUsd = (priceInUsdPerCoin * amount) / 1e18; //receive final price
        return totalPriceInUsd;
    }    
}