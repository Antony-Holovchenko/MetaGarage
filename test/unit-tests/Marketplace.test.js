const { expect } = require("chai")
const { ethers, deployments, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { callListItemFunc, getBal, callBuyItemFunc, callCancelItemFunc, callUpdItemFunc } = require("../../utils/helpers")

!developmentChains.includes(network.name)
? describe.skip
: describe("Car Marketplace Tests", function () {
    let  user1, user2, marketplace, marketplaceContract, carnft, carnftContract, initialBalance, reentrancyMockContract, reentrancy
    const URI = "Test Uri"
    const MINT_FEE = ethers.parseEther("1")
    const PRICE = ethers.parseEther("1")
    const INVALID_PRICE = ethers.parseEther("0")
    const NEW_PRICE_ETH = ethers.parseEther("0.5")
    const PROVIDER = ethers.provider
    const chainId = network.config.chainId // required for 1st test

    beforeEach("Set up contract for testing", async() => {
        [, user1, user2] = await ethers.getSigners()
        initialBalance = await getBal(user1, PROVIDER)
        //deploy all contracts
        await deployments.fixture(["all"])
        marketplaceContract = (await deployments.get("CarMarketplace")).address
        marketplace = await ethers.getContractAt("CarMarketplace", marketplaceContract)
        // create carnft instance
        carnftContract = (await deployments.get("CarNFT")).address
        carnft = await ethers.getContractAt("CarNFT", carnftContract)
        //mint nft, calculate a spent gas and approve marketplace
        await carnft.connect(user1).mint(URI, {value: MINT_FEE})     
        await carnft.connect(user1).approve(marketplaceContract, 1)
    })
        
    /* describe("Testing Marketplce constructor initialization", () => {
        // Comment this test, because of the private variable. 
        // This test is only working if change the s_priceFeed variable to public.
        // In contract it is set as private. This test successfully passing.
        it.only("Successfully initialize Marketplace contract", async () => {
            const priceFeed = await marketplace.s_priceFeed()
            let expectedPriceFeedAddress
            
            if (developmentChains.includes(network.name)) {
                expectedPriceFeedAddress = (await deployments.get("MockV3Aggregator")).address
            } else {
                expectedPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
            }
            expect(priceFeed).to.equal(expectedPriceFeedAddress)
        })
    }) */

 describe("ListItem function testing", () => {
        it("Successfully list new item on the marketplace", async() => {
            const txReceipt = await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
            const listedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1)
            const EXPECTED_PRICE_IN_USD = 2000000000000000000000 / 1e18
            
            expect(listedItem.priceInEth).to.equal(PRICE)
            expect(Number(listedItem.priceInUsd) / 1e18).to.equal(EXPECTED_PRICE_IN_USD)
            expect(listedItem.seller).to.equal(user1)
        })

        it("Successfully emit ItemListed event after listing", async() => {
            const txReceipt = await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
            await expect(txReceipt).to.emit(marketplace, "ItemListed").withArgs(
                user1, 
                carnftContract, 
                1, 
                PRICE
            )
        })

        it("Reverts if user listing the same item more than 1 time", async() => {
            expect(await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_NftAlreadyListed")
                .withArgs(carnftContract, 1)
        })

        it("Reverts if not an nft owner trying to do a listing", async() => {
            await expect(callListItemFunc(marketplace, user2, carnftContract, 1, PRICE))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_NotOwner").withArgs(user2)
            // verify item wasn't listed after declined listing function call
            const listedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1) 
            expect(listedItem.priceInEth).to.equal(0)
        })

        it("Reverts if user listing nft without setted price", async() => {
            await expect(callListItemFunc(marketplace, user1, carnftContract, 1, INVALID_PRICE))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_InvalidPriceValue").withArgs(INVALID_PRICE)
            const listedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1)
            expect(listedItem.priceInEth).to.equal(0)
        })

        it("Reverts if nft owner didn't approve marketplace to transfer nft", async() => {
            await carnft.connect(user2).mint(URI, {value: MINT_FEE})
            await expect(callListItemFunc(marketplace, user2, carnftContract, 2, PRICE))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_MarketplaceNotApproved")
            //verify item wasn't listed
            const listedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1)
            expect(listedItem.priceInEth).to.equal(0)
        })
    })

    
    describe("BuyItem function testing", () => {
        beforeEach("Prepare listed item before testing", async() => {
            await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
        })
        
        it("Successfully transfer nft ownership to buyer after purchase", async() => {
            await callBuyItemFunc(marketplace, user2, carnftContract, 1, PRICE)
            expect(await carnft.ownerOf(1)).to.equal(user2)
        })

        it("Successfully delist nft item on the marketplace after purchase", async() => {
            await callBuyItemFunc(marketplace, user2, carnftContract, 1, PRICE)
            const deletedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1)
            
            expect(deletedItem.priceInEth).to.equal(0)
            expect(deletedItem.seller).to.equal(ethers.ZeroAddress)  
        })

        it("Successfully update balance of buyer and withdraw balance of the seller after purchase", async() => {
            // collect balance of buyer before purchase 
            const buyerBalanceBeforePurchase = await getBal(user2, PROVIDER)
            const txReceipt = await callBuyItemFunc(marketplace, user2, carnftContract, 1, PRICE)
            const gasSpent = txReceipt.gasUsed * txReceipt.gasPrice
            // collect balance of buyer after purchase 
            const buyerBalanceAfterPurchase = await getBal(user2, PROVIDER)
            // grab the amount available for the seller for withdraw(should be updated to the amount of nft price) 
            const sellerWithdrawBalance = await marketplace.connect(user1).getWithdrawBalance(user1)
            
            expect(buyerBalanceAfterPurchase).to.equal(buyerBalanceBeforePurchase - (PRICE + gasSpent))
            expect(sellerWithdrawBalance).to.equal(PRICE)
        })
        
        it("Successfully emits ItemBought event after purchase", async() => {
            const txReceipt = await callBuyItemFunc(marketplace, user2, carnftContract, 1, PRICE)
            await expect(txReceipt).to.emit(marketplace, "ItemBought").withArgs(
                user1, 
                user2, 
                1,
                carnftContract, 
                PRICE
            )
        })

        it("Reverts if buyer buy a non listed item", async() => {
            // mint new nft, without listing
            await carnft.connect(user1).mint(URI, {value: MINT_FEE})
            await expect(callBuyItemFunc(marketplace, user2, carnftContract, 2, PRICE))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_NftNotListed")
                .withArgs(carnft, 2)
            // verify owner wasn't changed
            expect(await carnft.ownerOf(2)).to.equal(user1)
        })

        it("Reverts if buyer send not enough value", async() => {
            await expect(callBuyItemFunc(marketplace, user2, carnftContract, 1, INVALID_PRICE))
            .to.be.revertedWithCustomError(marketplace, "CarMarketplace_InvalidPaymentValue")
            .withArgs(carnft, 1, PRICE, INVALID_PRICE)
            // verify owner wasn't changed
            expect(await carnft.ownerOf(1)).to.equal(user1)
        })
    })

    describe("CancelListing function testing", () => {
        beforeEach("Prepare listed item before testing", async() => {
            await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
        })

        it("Successfully cancel listing on the  marketplace", async() => {
            await callCancelItemFunc(marketplace, user1, carnftContract, 1)
            const listedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1)
            expect(listedItem.priceInEth).to.equal(0)
            expect(listedItem.seller).to.equal(ethers.ZeroAddress)
        })

        it("Successfully emits ItemCancelled event after cancelling of the listing", async() => {
            const txReceipt = await callCancelItemFunc(marketplace, user1, carnftContract, 1)
            await expect(txReceipt).to.emit(marketplace, "ItemCancelled").withArgs(
                user1,
                carnftContract, 
                1
            )
        })

        it("Reverts if not an owner tries to cancel listing", async() => {    
            await expect(callCancelItemFunc(marketplace, user2, carnftContract, 1))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_NotOwner")
                .withArgs(user2)
            //verify item exist, after declined cancel function call
            const listedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1)
            expect(listedItem.priceInEth).to.equal(PRICE)
        })

        it("Reverts if user canceling a non listed item", async() => {
            await carnft.connect(user2).mint(URI, {value: MINT_FEE})
            await expect(callCancelItemFunc(marketplace, user2, carnftContract, 2))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_NftNotListed")
                .withArgs(carnftContract, 2)
        })  
    })

    describe("Updateitem function testing", () => {
        beforeEach("Prepare listed item before testing", async() => {
            await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
        })

        it("Successfully update listing", async() => {
            const NEW_PRICE_USD = 1000000000000000000000 / 1e18
            await callUpdItemFunc(marketplace, user1, carnftContract, 1, NEW_PRICE_ETH)
            const updatedItem = await marketplace.connect(user1).getListedItem(carnftContract, 1)

            expect(updatedItem.priceInEth).to.equal(NEW_PRICE_ETH)
            expect(Number(updatedItem.priceInUsd) / 1e18).to.equal(NEW_PRICE_USD)
            expect(updatedItem.seller).to.equal(user1)
        })

        it("Successfully emits ItemUpdated event after update", async() => {
            const txReceipt = await callUpdItemFunc(marketplace, user1, carnftContract, 1, NEW_PRICE_ETH)
            await expect(txReceipt).to.emit(marketplace, "ItemUpdated").withArgs(
                user1,
                carnftContract, 
                1,
                NEW_PRICE_ETH
            )
        })

        it("Reverts if not an owner tries to update listing", async() => {
            await expect(callUpdItemFunc(marketplace, user2, carnftContract, 1, NEW_PRICE_ETH))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_NotOwner")
                .withArgs(user2)
            // verify nothing was updated in the target item
            const updatedItem = await marketplace.connect(user2).getListedItem(carnftContract, 1)
            expect(updatedItem.priceInEth).to.not.equal(NEW_PRICE_ETH)
            expect(Number(updatedItem.priceInUsd) / 1e18).to.not.equal(1000000000000000000000 / 1e18)
            expect(updatedItem.seller).to.not.equal(ethers.ZeroAddress)
        })

        it("Reverts if user updating a non listed item", async() => {
            //mint new nft without listing
            await carnft.connect(user2).mint(URI, {value: MINT_FEE})
            await expect(callUpdItemFunc(marketplace, user2, carnftContract, 2, NEW_PRICE_ETH))
                .to.be.revertedWithCustomError(marketplace, "CarMarketplace_NftNotListed")
                .withArgs(carnftContract, 2)
            // verify nothing was updated in the target item
            const updatedItem = await marketplace.connect(user2).getListedItem(carnftContract, 2)
            expect(updatedItem.priceInEth).to.equal(0)
            expect(updatedItem.priceInUsd).to.equal(0)
            expect(updatedItem.seller).to.equal(ethers.ZeroAddress)
        })
    })

    describe("withdrawBalance function testing", () => {
        beforeEach("Prepare listed item before testing", async() => {
            await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
            await marketplace.connect(user2).buyItem(carnftContract, 1, {value: PRICE})
        })

        it("Successfull withdraw emits 'Withdrowal' event", async() => {
            const withdrawalAmount = await marketplace.connect(user1).getWithdrawBalance(user1) 
            const txResponse = await marketplace.connect(user1).withdrawBalance()
            const txReceipt = await txResponse.wait(1)
            await expect(txReceipt).to.emit(marketplace, "Withdrowal").withArgs(
                withdrawalAmount,
                user1
            )
        })

        it("User balance successfully increased after withdrawal", async() => {
            await marketplace.connect(user1).withdrawBalance()
            const userBalAfterWithdrawal = await getBal(user1, PROVIDER)   
            const expectedUserBalAfterWithdrawal = initialBalance - MINT_FEE + PRICE ////- totalGasSpent
            
            expect(userBalAfterWithdrawal).to.equal(expectedUserBalAfterWithdrawal) 
        })

        it("User balance successfullys set to 0, after withdrawal", async() => {
            await marketplace.connect(user1).withdrawBalance()
            const withdrawalAmount = await marketplace.connect(user1).getWithdrawBalance(user1) 
            expect(withdrawalAmount).to.equal(0)
        })

        it("Reverts if user withdraw a 0 balance", async() => {
            await expect(marketplace.connect(user2).withdrawBalance())
            .to.be.revertedWith("Nothing to withdraw")
        })
        
        // This test should be fixed(Still in development)
        /* it("Reentrancy", async() => {
            reentrancyMockContract = (await deployments.get("MockReentrancyAttack")).address
            reentrancy = await ethers.getContractAt("MockReentrancyAttack", reentrancyMockContract)
            await reentrancy.prepareForAttack(carnftContract, marketplaceContract, URI, 2, {value: MINT_FEE}) 
            await marketplace.connect(user2).buyItem(carnftContract, 2, {value: PRICE})
            await reentrancy.attack()
        }) */
    })

    describe("Testing getListedItem function", () => {
        beforeEach("Prepare listed item before testing", async() => {
            await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
        })
        
        it("Successfully returns listed item", async() => {
            const item = await marketplace.connect(user1).getListedItem(carnftContract, 1)
            const EXPECTED_PRICE_IN_USD = 2000000000000000000000 / 1e18            
            
            expect(item.priceInEth).to.equal(PRICE)
            expect(Number(item.priceInUsd) / 1e18).to.equal(EXPECTED_PRICE_IN_USD)
            expect(item.seller).to.equal(user1)
        })

        it("Successfully returns a default values if item doesn't exist", async() => {
            const nonExistentItem = await marketplace.connect(user1).getListedItem(carnftContract, 2)
            expect(nonExistentItem.priceInEth).to.equal(0)
            expect(nonExistentItem.priceInUsd).to.equal(0)
            expect(nonExistentItem.seller).to.equal(ethers.ZeroAddress)
        })
    })

    describe("Testing getWithdrawBalance function", () => {
        beforeEach("Prepare listed item before testing", async() => {
            await callListItemFunc(marketplace, user1, carnftContract, 1, PRICE)
        })
        
        it("Successfully returns the balance of the user", async() => {
            expect(await marketplace.connect(user1).getWithdrawBalance(user1)).to.equal(0)
            await marketplace.connect(user2).buyItem(carnftContract, 1, {value: PRICE})
            expect(await marketplace.connect(user1).getWithdrawBalance(user1)).to.equal(PRICE)
        })

        it("Reverts if address in parameter is empty", async() => {
            await expect(marketplace.connect(user1).getWithdrawBalance(ethers.ZeroAddress))
            .to.be.revertedWith("Invalid address")
        })
    })

    // Function is private in the contract, so first make it public
    // to test this test suit. I have tested this function successfully,
    // but to pass all the tests I commented these tests below.
    /* describe("Testing convertEthToUsd function", () => {
        it("Successfully convert eth to usd", async() => {
            const EXPECTED_PRICE_IN_USD = 2000000000000000000000 / 1e18            
            const actualPrice = (Number(await marketplace.connect(user1).convertEthToUsd(PRICE))) / 1e18
            expect(actualPrice).to.equal(EXPECTED_PRICE_IN_USD)
        })

        it("Reverts if 0 amount was passed to a parameter", async() => {
            expect(marketplace.connect(user1).convertEthToUsd(PRICE))
            .to.be.revertedWith("Amount value <= 0")
        })
    }) */

})
