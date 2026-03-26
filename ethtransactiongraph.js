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

var ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
];

var httpProvider = new ethers.JsonRpcProvider("https://ethereum-rpc.publicnode.com");

async function showNodeInfo(address) {
    var output = document.getElementById("output");

    // Count local graph stats
    var sent = links.filter(function (l) {
        var src = l.source.id || l.source;
        return src === address;
    }).length;
    var received = links.filter(function (l) {
        var tgt = l.target.id || l.target;
        return tgt === address;
    }).length;

    var txBadges =
        '<span class="badge bg-primary">' + sent + ' sent</span> ' +
        '<span class="badge bg-success">' + received + ' received</span>';

    // Show local data immediately
    output.innerHTML =
        '<a href="https://etherscan.io/address/' + address + '" target="_blank">' + address + '</a>' +
        '<div class="mt-2">' + txBadges + '</div>' +
        '<div class="text-muted mt-1">Loading...</div>';

    // Fetch on-chain data
    try {
        var [balance, code] = await Promise.all([
            httpProvider.getBalance(address),
            httpProvider.getCode(address)
        ]);

        var isContract = code !== '0x';
        var balanceStr = parseFloat(ethers.formatEther(balance)).toFixed(4);

        var html =
            '<a href="https://etherscan.io/address/' + address + '" target="_blank">' + address + '</a>' +
            (isContract ? ' <span class="badge bg-warning text-dark">Contract</span>' : ' <span class="badge bg-info">EOA</span>') +
            '<div class="mt-2">' + balanceStr + ' ETH</div>' +
            '<div class="mt-1">' + txBadges + '</div>';

        // If it's a contract, try to read ERC-20 token info
        if (isContract) {
            try {
                var token = new ethers.Contract(address, ERC20_ABI, httpProvider);
                var [name, symbol, decimals, totalSupply] = await Promise.all([
                    token.name(),
                    token.symbol(),
                    token.decimals(),
                    token.totalSupply()
                ]);
                var supplyStr = parseFloat(ethers.formatUnits(totalSupply, decimals)).toLocaleString();
                html += '<div class="mt-2"><strong>' + name + '</strong> (' + symbol + ')</div>';
                html += '<div class="text-muted">Supply: ' + supplyStr + ' ' + symbol + '</div>';
            } catch (e) {
                // Not an ERC-20 token — skip
            }
        }

        output.innerHTML = html;
    } catch (e) {
        // Keep the local data if RPC fails
    }
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
        .on('click', function (d) { showNodeInfo(d.id); })
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
