var web3 = new Web3(Web3.givenProvider || 'wss://mainnet.infura.io/_ws');

var subscription;


function start() {
    console.log("Starting...")
    var output = document.getElementById('output')

    subscription = web3.eth.subscribe('pendingTransactions', function (error, result) {
    })
        .on("data", function (transactionHash) {
            console.log(transactionHash);
            web3.eth.getTransaction(transactionHash)
                .then(function (transaction) {
                    console.log(transaction);
                    var from = { id: transaction.from }
                    var fromFound = nodes.some(function (el) {
                        return el === from;
                        console.log("Duplicate Found")
                    })
                    var to = { id: transaction.to }
                    var toFound = nodes.some(function (el) {
                        return el === to;
                        console.log("Duplicate Found")
                    })
                    if (!fromFound) { nodes.push(from); }
                    if (!toFound) { nodes.push(to); }
                    links.push({ source: from, target: to });
                    restart();
                });
        })
    
}

function stop() {
    console.log("Stopping...")
    // unsubscribes the subscription
    subscription.unsubscribe(function (error, success) {
        if (success)
            console.log('Successfully unsubscribed!');
    });


}




var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    color = d3.scaleOrdinal(d3.schemeCategory10);

var nodes = [],
    links = [];

var simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-10))
    .force("link", d3.forceLink(links).distance(20))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .alphaTarget(1)
    .on("tick", ticked);

var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
    link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
    node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");

restart();

function restart() {

    // Apply the general update pattern to the nodes.
    node = node.data(nodes, function (d) { return d.id; });
    node.exit().remove();
    node = node.enter().append("circle").attr("fill", function (d) { return color(d.id); }).attr("r", 2).merge(node);

    // Apply the general update pattern to the links.
    link = link.data(links, function (d) { return d.source.id + "-" + d.target.id; });
    link.exit().remove();
    link = link.enter().append("line").merge(link);

    // Update and restart the simulation.
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
}

function ticked() {
    node.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })

    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });
}
