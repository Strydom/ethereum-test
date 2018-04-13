const Web3 = require('web3');
let web3 = new Web3();

// mining address: 0x023e291a99d21c944a871adcc44561a58f99bdbc
// 0x49cbE44E2776C0802B9D2998c29D180015916ff2

let ip = "35.197.209.38",
    provider = "http://" + ip + ":8545",
    fromAddress = '0x023e291a99d21c944a871adcc44561a58f99bdbc',
    toAddress = '0x49cbE44E2776C0802B9D2998c29D180015916ff2',
    amount = '10', unit = "ether";

web3.setProvider(new web3.providers.HttpProvider(provider));

let setup = getCoinbase()
    .then(() => getAccounts()
        .then(() => isListeningForPeers()
            .then(() => getPeerCount()
                .then(() => getGasPrice()))));

let balanceAndTxCount = setup
    .then(() => getBalance(toAddress)
        .then(() => getTransactionCount(fromAddress)));


balanceAndTxCount
    .then(() => getTransactionsByAccount(fromAddress, 0, 3500)
        .then(transactions => transactions.forEach(transaction => console.log(transaction))));

// setup.then(() => sendTransaction(fromAddress, toAddress, 'linux', amount, unit));
// createAccount("password").then(address => sendTransaction(fromAddress, address, amount, unit));

// =====================================================================================================================

function sendTransaction(from, to, password, amount, unit) {
    console.log("Sending " + amount + " " + unit + " from " + from + " to " + to);

    return unlockAccount(from, password, 180).then(() =>
        web3.eth.sendTransaction({
            from: from,
            to: to,
            value: web3.utils.toWei(amount, unit)
        })
            .on('transactionHash', hash => console.log("Transaction hash: " + hash))
            .on('receipt', receipt => {
                console.log("Sent " + amount + " " + unit + " from " + from + " to " + to);
                console.log("Transaction receipt:");
                console.log(receipt);
            })
            .on('confirmation', function(confirmationNumber, receipt) {
                console.log("Confirmation number: " + confirmationNumber);
                // console.log("Transaction receipt: " + receipt);
            })
            .on('error', error => {
                console.error("Error sending " + amount + " " + unit + " from " + from + " to " + to);
                console.error(error);
            })
    );
}

function getTransactionCount(address) {
    return web3.eth.getTransactionCount(address)
        .catch(error => console.error("Error getting transaction count for " + address + ": " + error))
        .then(count => console.log("Transaction count for " + address + ": " + count));
}

function unlockAccount(account, password, time) {
    console.log("Unlocking account " + account + " for " + time + " seconds");

    return web3.eth.personal.unlockAccount(account, password, time)
        .catch(error => {
            console.error("Error unlocking account " + account);
            console.error(error);
        })
        .then(result => console.log("Unlocked account " + account + " " + result));
}

function signTransaction(from, to, amount, unit, gasLimit, gasPrice, nonce) {
    return web3.eth.signTransaction({
            from: from,
            to: to,
            value: web3.utils.toWei(amount, unit),
            gas: gasLimit - 1000,
            gasPrice: gasPrice,
            nonce: nonce
        })
        .catch(error => console.error("Error signing transaction: " + error))
        .then(signedTransaction => {
            console.log("Signed transaction:");
            console.log(signedTransaction);
        });
}

function getBlock(block) {
    console.log("Getting block " + block);

    return web3.eth.getBlock("latest")
        .catch(error => console.error("Error getting latest block: " + error))
        .then(console.log);
}

function getCoinbase() {
    return web3.eth.getCoinbase()
        .catch(error => console.error("Error getting coinbase: " + error))
        .then(coinbase => console.log("Coinbase: " + coinbase));
}

function getAccounts() {
    return web3.eth.getAccounts()
        .catch(error => console.error("Error getting accounts: " + error))
        .then(accounts => {
            console.log("Accounts:");
            console.log(accounts);
        });
}

function isListeningForPeers() {
    return web3.eth.net.isListening()
        .catch(error => console.error("Error checking if the node is listening for peers: " + error))
        .then(isListening => console.log("Listening for peers: " + isListening));
}

function getPeerCount() {
    return web3.eth.net.getPeerCount()
        .catch(error => console.error("Error getting the number of connected peers: " + error))
        .then(peerCount => console.log("Number of peers: " + peerCount));
}

function getGasPrice() {
    return web3.eth.getGasPrice()
        .catch(error => console.error("Error getting gas price: " + error))
        .then(gasPrice => console.log("Gas price: " + gasPrice));
}

function createAccount(password) {
    console.log("Creating new account...");

    return web3.eth.personal.newAccount(password)
        .catch(error => console.error("Error creating account: " + error))
        .then(account => console.log("New account address: " + account));
}

function getBalance(address) {
    return web3.eth.getBalance(address)
        .catch(error => console.error("Error getting balance: " + error))
        .then(balance => console.log("Ether in account " + address + ": " + web3.utils.fromWei(balance, 'ether')));
}

function getTransaction(transaction) {
    web3.eth.getTransaction(transaction)
        .catch(error => console.error("Error getting transaction: " + error))
        .then(transaction => {
            console.log("Fetched transaction:");
            console.log(transaction);
        });
}

function getTransactionsByAccount(account, startBlockNumber, endBlockNumber) {
    account = web3.utils.toChecksumAddress(account);

    console.log("Searching for transactions to/from account \"" + account + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);

    let promises = [];
    for (let i = startBlockNumber; i <= endBlockNumber; i++) {
        if (i % 1000 === 0) {
            console.log("Reached block " + i);
        }

        promises.push(web3.eth.getBlock(i, true));
    }

    return new Promise((resolve, reject) => {
        Promise.all(promises)
            .then(blocks => {
                let txArr = [], block, bi, txs, tx, ti;

                for (bi = 0; bi < blocks.length; bi++) {
                    block = blocks[bi];
                    txs = block ? block.transactions : null;

                    if (txs) {
                        for (ti = 0; ti < txs.length; ti++) {
                            tx = txs[ti];
                            if (account === "*" || account === tx.from || account === tx.to) {
                                txArr.push(tx);
                            }
                        }
                    }
                }

                resolve(txArr);
            });
    });
}

// function sendSignedTransaction(from, to, amount, unit) {
//     getBlock("latest")
//         .then(block => {
//             let gasLimit = block.gasLimit;
//             console.log("Block gas limit:" + gasLimit);
//
//             getGasPrice()
//                 .then(gasPrice => unlockAccount(from, "linux", 100)
//                         .then(() => signTransaction(from, to, amount, unit, gasLimit, gasPrice, 0)
//                                 .then(signedTransaction => sendRawSignedTransaction(signedTransaction))));
//         });
// }
//
// function sendRawSignedTransaction(signedTransaction) {
//     return web3.eth.sendSignedTransaction(signedTransaction.raw)
//         .on('transactionHash', hash => console.log("Transaction hash: " + hash))
//         .on('receipt', receipt => {
//             console.log("Transaction receipt:");
//             console.log(receipt);
//         })
//         .on('confirmation', function (confirmationNumber, receipt) {
//             console.log("Confirmation number: " + confirmationNumber);
//         })
//         .on('error', error => {
//             console.log("Error sending signed transaction:");
//             console.log(signedTransaction);
//             console.log(error);
//         });
// }