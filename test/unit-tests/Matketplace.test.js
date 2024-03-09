/* const { expect } = require('chai');
const { ethers } = require('hardhat');

const toWei = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether') //1 ether = 1**18 wei
}

describe('Marketplace', () => {
    let buyer, seller
    let carnft
    let marketplace
    
    beforeEach(async () => {
        //set buyer and seller accounts
        [buyer, seller] = await ethers.getSigners()
    
        //deploy CarNFT contract
        const CarNFT = await ethers.getContractFactory("CarNFT")
        carnft = await CarNFT.deploy()

        //mint
        let transaction = await carnft.connect(seller).mint("ipfs://bafybeif7zvo6ri45yp5etynzvlnfxnpl37335bqiykronyzdgapvc6m2om")
        await transaction.wait() 

        //deploy escrow contract
        const Marketplace = await ethers.getContractFactory("Marketplace")
        marketplace = await Marketplace.deploy(
            carnft.address, 
            seller.address
        )
    })

    describe("Constructor testing", () => {
       
        it("Successfully set NFT address", async () => {
            const response = await marketplace.nftAddress()
            expect(response).to.equal(carnft.address)
        })

        it("Successfully set seller address", async () => {
            const response = await marketplace .seller()
            expect(response).to.equal(seller.address)
        })

    })

})
 */