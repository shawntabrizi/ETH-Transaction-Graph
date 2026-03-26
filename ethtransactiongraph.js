// Public WebSocket RPC (no API key needed)
const WSS_RPC = "wss://ethereum-rpc.publicnode.com";

var provider;
var nodes = [];
var links = [];
var track = {};

function start() {
    console.log("Starting...");

    provider = new ethers.WebSocketProvider(WSS_RPC);

    provider.on("pending", async (txHash) => {
        try {
            const tx = await provider.getTransaction(txHash);
            if (tx && tx.from && tx.to) {
                createNode(tx.from, tx.to);
            }
        } catch (e) {
            // Transaction may vanish before we can fetch it — ignore
        }
    });
}

function stop() {
    console.log("Stopping...");
    if (provider) {
        provider.removeAllListeners("pending");
        provider.destroy();
        provider = null;
    }
}

function createNode(from, to) {
    if (!(from in track)) {
        track[from] = nodes.length;
        nodes.push({ id: from });
    }

    if (!(to in track)) {
        track[to] = nodes.length;
        nodes.push({ id: to });
    }

    links.push({ source: nodes[track[from]], target: nodes[track[to]] });

    restart();
}

// D3.js force-directed graph
var width = 960;
var height = 960;
var color = d3.scaleOrdinal(d3.schemeCategory20);

var svg = d3.select("#graph").append("svg")
    .attr("id", "playgraph")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMidYMid meet");

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

function restart() {
    node = node.data(nodes, function (d) { return d.id; });
    node.exit().remove();
    node = node.enter()
        .append("circle")
        .attr("r", 5)
        .attr("fill", function (d) { return color(Math.random()); })
        .on('click', function (d) {
            document.getElementById("output").innerHTML = '<a href="https://etherscan.io/address/' + d.id + '" target="_blank">' + d.id + '</a>';
        })
        .merge(node);

    link = link.data(links, function (d) { return d.source.id + "-" + d.target.id; });
    link.exit().remove();
    link = link.enter().append("line").merge(link);

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
