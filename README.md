# ETH Transaction Graph
Using Infura's WebSockets, Web3.js's Subscriptions, and D3.js's Force Directed Graphs to visualize Ethereum's pending transactions.

Look how simple Web3.js makes it for us:
```
function start() {
    console.log("Starting...")
    var output = document.getElementById('output')

    subscription = web3.eth.subscribe('pendingTransactions', function (error, result) {
    })
        .on("data", function (transactionHash) {
            web3.eth.getTransaction(transactionHash)
                .then(function (transaction) {
                    createNode(transaction.from, transaction.to);
                });
        })
    
}
```
## Check out other simple Web3.js samples
https://github.com/shawntabrizi/ETH-Balance

https://github.com/shawntabrizi/ERC-20-Token-Balance

https://github.com/shawntabrizi/ETH-Balance-Graph


![Screenshot](https://i.imgur.com/YW0nsfj.png)
