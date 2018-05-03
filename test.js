const Web3 = require('web3');
const fs = require('fs');
let web3 = new Web3();

// mining address: 0x023e291a99d21c944a871adcc44561a58f99bdbc
// 0x49cbE44E2776C0802B9D2998c29D180015916ff2

let provider = "http://104.196.16.151:8545",
    fromAddress = '0x023e291a99d21c944a871adcc44561a58f99bdbc',
    toAddress = '0x49cbE44E2776C0802B9D2998c29D180015916ff2',
    amount = '1', unit = "ether";

web3.setProvider(new web3.providers.HttpProvider(provider));

sendTransactionsPeriodically(5, 15, 100);

// printBlockStats("tests/blocks.csv");

function printBlockStats(path) {
    let writeStream = fs.createWriteStream(path);
    let headers = "Block, Difficulty (hash/solution), Timestamp, Gas limit, Gas used, Number of transactions";

    writeStream.write(headers);

    web3.eth.getBlockNumber().then(latestBlockNumber => {
        for (let i = 1; i < latestBlockNumber; i++) {
            web3.eth.getBlock(i).then(block => {
                let result = "\r\n" + i + ", " +
                    block.difficulty + ", " +
                    block.timestamp + ", " +
                    block.gasLimit + ", " +
                    block.gasUsed + ", " +
                    block.transactions.length;
                writeStream.write(result);
            });
        }
    });

    // This is here incase any errors occur
    writeStream.on('error', function (err) {
        console.log(err);
    });
}

function sendTransactionsPeriodically(count = 221, interval = 30, repeatCount = 2) {
    unlockAccount(fromAddress, 'linux', 60*60).then(unlocked => {
        if (unlocked === true) {
            console.log("Account unlocked. Waiting 5 seconds for the unlock to complete...");
            console.log("Sending " + count + " transactions every " + interval + " seconds");

            let originalCount = repeatCount;
            setTimeout(function() {
                let repeat = setInterval(function () {
                    if (repeatCount === originalCount) {
                        console.log("Tests started at:", Date.now());
                    }
                    console.log("Sending " + count + " transactions...");

                    for (let i = 0; i < count; i++) {
                        sendTransaction(fromAddress, toAddress, amount, unit);
                    }

                    if (--repeatCount === 0) {
                        clearInterval(repeat);
                    }

                    console.log("Bursts left:", repeatCount);
                }, 1000 * interval);
            }, 5000);

        } else {
            console.log("Failed to unlock account");
        }
    });
}

function sendTransaction(from, to, amount, unit) {
    try {
        web3.eth.sendTransaction({
            from: from,
            to: to,
            value: unit === "wei" ? amount : web3.utils.toWei(amount, unit)
        }).on('error', error => {
            console.log(error);
        });
    } catch (error) {
        console.log(error);
    }
}

function unlockAccount(account, password, time) {
    console.log("Unlocking account " + account + " for " + time + " seconds");

    return web3.eth.personal.unlockAccount(account, password, time)
        .catch(error => {
            console.error("Error unlocking account " + account);
            console.error(error);
        });
}