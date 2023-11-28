import { Lab } from "./lab.js";
import { ArrayMap, subIpCompatible } from "./utils.js";

const serverUrl = "http://localhost:8000/";

const staticFolder = "static/";
const networkFolder = "network/";
const imagesFolder = staticFolder + "images/";

const networkUrl = serverUrl + networkFolder;

const filesListUrl = "filesList";

let lab = new Lab(filesListUrl, networkUrl);

const collisionDomainColor = '#00ff1e';
const routerImageLocation = imagesFolder + "router.svg";
const computerImageLocation = imagesFolder + "computer2.png";
const serverImageLocation = imagesFolder + "server.jpg";

let nodesArray = [];
let edgesArray = [];

// setting up collision domains
for (let i=0; i<lab.collisionDomains.length; i++) {
    let collisionDomain = lab.collisionDomains[i];
    let node = {id: collisionDomain, label: collisionDomain, color: collisionDomainColor};
    nodesArray.push(node);
}

// setting up machines (making machine nodes for network representation)
for (let i=0; i<lab.machines.length; i++) {
    let machine = lab.machines[i];
    let image;
    if (machine.type === "router") image=routerImageLocation;
    else image=computerImageLocation;
    let node = {id: machine.name, label: machine.name, shape: "image", image: image};
    nodesArray.push(node);
    // setting up links from machine to collision domains
    let devices = ArrayMap.keys(machine.device2collisionDomain);
    for (let device of devices) {
        let label = ArrayMap.get(machine.device2ipNetmask, device); // label=ip/netmask
        let edge = {from: machine.name, to: ArrayMap.get(machine.device2collisionDomain, device), label: label};
        edgesArray.push(edge);
    }
}

let nodes = new vis.DataSet(nodesArray);
let edges = new vis.DataSet(edgesArray);

var container = document.getElementById('mynetwork');

var data = {
    nodes: nodes,
    edges: edges
};

var options = {
    interaction: {
        zoomSpeed: 0.2
    },
    manipulation: {
        enabled: true,
        initiallyActive: true,
        addNode: function(nodeData,callback) {
            let nodeName = document.getElementById("nodeName").value;
            if (!nodeName) {
                alert("node name is empty");
                return;
            }
            if (lab.hasCollisionDomain(nodeName)) {
                alert("node name already used for a collision domain");
                return;
            }
            if (lab.hasMachine(nodeName)) {
                alert("node name already used for a machine");
                return;
            }
            let nodeType = document.getElementById("nodeType").value;
            nodeData.id = nodeName;
            nodeData.label = nodeName;
            if (nodeType === "collisionDomain") {
                let ipNetmask = document.getElementById("ipnetmask").value;
                if (!ipNetmask) {
                    alert("add domain ip/netmask");
                    return;
                }
                // should add a lab function to assert if given ip/netmask makes sense
                nodeData.color = collisionDomainColor;
                callback(nodeData);
                lab.addCollisionDomain(nodeName, ipNetmask);
            }
            else { // nodeType machine
                nodeData.shape = "image";
                nodeData.image = computerImageLocation;
                callback(nodeData);
                lab.addMachine(nodeName);
            }
        },
        addEdge: function(edgeData, callback) {
            let from = edgeData.from;
            let to = edgeData.to;
            if (lab.collisionDomains.includes(from) && lab.collisionDomains.includes(to)) {
                alert("cannot connect two collision domains");
                return;
            }
            if (lab.machineNames.includes(from) && lab.machineNames.includes(to)) {
                alert("cannot connect two machines");
                return;
            }
            let collisionDomain = lab.collisionDomains.includes(from) ? from : to;
            let machineName = lab.machineNames.includes(from) ? from : to;
            let collisionDomainIpNetmask = ArrayMap.get(lab.collisionDomains2ipNetmask, collisionDomain);
            let wantedSubIp = document.getElementById("edgeip").value;
            let collisionDomainIp = collisionDomainIpNetmask.split("/")[0];
            let collisionDomainNetmask = collisionDomainIpNetmask.split("/")[1];
            let wantedCompleteIp = subIpCompatible(collisionDomainIp, collisionDomainNetmask, wantedSubIp);
            if (!wantedCompleteIp) {
                alert(wantedSubIp + " not compatible with collision domain ip");
                return;
            }
            if (lab.allIps.includes(wantedCompleteIp)) {
                alert(wantedCompleteIp + " already in use");
                return;
            }
            let wantedCompleteIpNetmask = wantedCompleteIp + "/" + collisionDomainNetmask;
            edgeData.label = wantedCompleteIpNetmask;
            callback(edgeData);
            let machine = lab.getMachine(machineName);
            let device = "eth" + machine.device2collisionDomain.length;
            ArrayMap.put(machine.device2collisionDomain, device, collisionDomain);
            ArrayMap.put(machine.device2ipNetmask, device, wantedCompleteIpNetmask)
            if (machine.device2collisionDomain.length > 1) machine.type = "router";
            else machine.type = "computer";
        },
        deleteNode: function(data, callback) {
            console.log(data)
            let nodes = data.nodes;
            let edges = data.edges;
            for (let i=0; i<nodes.length; i++) {
                let node = nodes[i];
                if (lab.hasMachine(node)) lab.removeMachine(node);
                if (lab.hasCollisionDomain(node)) lab.removeCollisionDomain(node);
            }
            for (let i=0; i<edges.length; i++) {
                let edge = edges[i];
                
            }
            // callback(data)
        }
    }
};

var network = new vis.Network(container, data, options);

// save changes to configuration files
function updateLabFiles() {
    sendPost(lab, "updateLab");
}

// when adding a collisiondomain pops the menu to insert collision domain ip/netmask
// when adding a machine this menu is hidden
document.getElementById("ipnetmask-div").style.display = 'none';
document.getElementById("nodeType").addEventListener("click", (event) => {
    let nodeType = document.getElementById("nodeType").value;
    if (nodeType === "collisionDomain")
        document.getElementById("ipnetmask-div").style.display = '';
    else
        document.getElementById("ipnetmask-div").style.display = 'none';
});