const { network } = require("hardhat")

function sleep(timeInMs) {
    return new Promise((resolve) => setTimeout(resolve, timeInMs))
}
// In the local development environment(Hardhat blockchain), blocks are only mined 
// when a transaction occurs. The real blockchains are different, because blocks 
// are mined at regular intervals regardless of whether there are transactions.
// <amount> - is the number of blocks to move
// <sleepAmount> - is the time to wait (in milliseconds) between mining each block. It is simulates a real delay on the real blockchain.

async function moveBlocks(amount, sleepAmount = 0) {
    console.log("Moving blocks...")
    for (let index = 0; index < amount; index++) {
        await network.provider.request({
            method: "evm_mine",
            params: []
        })
        if (sleepAmount) {
            console.log(`Sleeping for ${sleepAmount}`)
            await sleep(sleepAmount)
        }
    }
    console.log(`Moved ${amount} blocks`)
}

module.exports = {
    moveBlocks,
    sleep,
}