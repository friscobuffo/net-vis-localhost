import { readFile, ArrayMap, generaliseIp } from "./utils.js";

const labConfFile = "lab.conf";

class Machine {
    constructor(name) {
        this.name = name;
        this.device2collisionDomain = new Array(); // actually a MAP implemented with an array
        this.device2ipNetmask = new Array(); // actually a MAP implemented with an array
    }

    getNextFreeDevice() {
        let devices = ArrayMap.keys(this.device2collisionDomain);
        devices.sort();
        for (let i=0; i<devices.length; i++) {
            let device = devices[i];
            if (`eth${i}` < device)
                return `eth${i}`;
        }
        return `eth${devices.length}`;
    }

    addLink(collisionDomainName, ipNetmask) {
        let device = this.getNextFreeDevice();
        ArrayMap.put(this.device2collisionDomain, device, collisionDomainName);
        ArrayMap.put(this.device2ipNetmask, device, ipNetmask);
    }

    removeLinkWithCollisionDomain(collisionDomain) {
        let device = ArrayMap.removeFirstValue(this.device2collisionDomain, collisionDomain);
        if (device)
            ArrayMap.removeKey(this.device2ipNetmask, device);
        return device;
    }
}

class Lab {
    constructor(filesListUrl, labUrl) {
        this.labUrl = labUrl;
        this.allIps = []; // list of all machine's ips
        this.collisionDomains = []; // list of all collision domains
        this.machines = [];
        this.machineNames = [];
        this.collisionDomains2ipNetmask = []; // actually a MAP implemented with an array
        this.errors = [];

        let fileNames = readFile(filesListUrl);
        fileNames = JSON.parse(fileNames);
        if (fileNames.includes("lab.conf")) {
            this.getLabTopology();
            this.setupMachinesIp(fileNames);
        }
        if (this.errors.length)
            console.log(this.errors);
    }

    readNetworkFile(networkFilePath) {
        return readFile(this.labUrl + networkFilePath);
    }

    // get machine from lab given machineName
    getMachine(machineName) {
        for (let i=0; i<this.machines.length; i++)
            if (this.machines[i].name == machineName) return this.machines[i];
    }
    
    // gets network topology from lab.conf file
    getLabTopology() {
        let labConf = this.readNetworkFile(labConfFile).replaceAll('"', '');
        let labConfFileLines = labConf.split("\n");
        for (let i=0; i<labConfFileLines.length; i++) {
            let line = labConfFileLines[i];
            if (!line) continue; // line is empty
            if (line.startsWith("LAB_")) continue;
            if (line.startsWith("#")) continue;
            let openSquareBracketIndex = line.indexOf("[");
            let closedSquareBracketIndex = line.indexOf("]");
            if (line.substring(openSquareBracketIndex+1, closedSquareBracketIndex) === "image")
                continue;
            let machineName = line.substring(0, openSquareBracketIndex);
            let device = "eth"+line.substring(openSquareBracketIndex+1, closedSquareBracketIndex);
            let collisionDomain = line.substring(closedSquareBracketIndex+2)
            if (!this.collisionDomains.includes(collisionDomain))
                this.collisionDomains.push(collisionDomain);
            if (!this.machineNames.includes(machineName)) {
                this.machineNames.push(machineName);
                let machine = new Machine(machineName);
                this.machines.push(machine);
            }
            let machine = this.getMachine(machineName);
            ArrayMap.put(machine.device2collisionDomain, device, collisionDomain);
        }
    }

    // assign ip/netmasks to all links (reads all and only .startup files)
    setupMachinesIp(fileNamesArray) {
        for (let i=0; i<fileNamesArray.length; i++) {
            let fileName = fileNamesArray[i];
            if (!fileName.endsWith(".startup")) continue;
            let machineName = fileName.substring(0, fileName.length-8);
            if (!this.machineNames.includes(machineName)) {
                this.errors.push(machineName + " not in lab.conf");
                let machine = new Machine(machineName);
                this.machines.push(machine);
                this.machineNames.push(machineName);
            }
            let machine = this.getMachine(machineName);
            let startupFile = this.readNetworkFile(fileName);
            let startupFileLines = startupFile.split("\n");
            for (let j=0; j<startupFileLines.length; j++) {
                let line = startupFileLines[j];
                if (!line) continue;
                if (!line.startsWith("ip address add") && !line.startsWith("ip a add")) continue;
                let tokens = line.split(" "); // assuming line is "ip address add 12.12.12.12/12 dev eth0"
                let device = tokens[5];
                let ipNetmask = tokens[3];
                ArrayMap.put(machine.device2ipNetmask, device, ipNetmask);
                let ip = ipNetmask.split("/")[0];
                let netmask = ipNetmask.split("/")[1];
                if (this.allIps.includes(ip))
                    this.errors.push("machine: " + machine.name + "device: " + device + "ip: " + ip + "/" + netmask + " in conflict");
                else this.allIps.push(ip);
                // checking if device ip is compatible with collision domain ip/netmask
                let collisionDomain = ArrayMap.get(machine.device2collisionDomain, device);
                let generalisedIpNetmask = generaliseIp(ip, netmask) + "/" + netmask;
                if (ArrayMap.has(this.collisionDomains2ipNetmask, collisionDomain)) {
                    let collisionDomainIpNetmask = ArrayMap.get(this.collisionDomains2ipNetmask, collisionDomain);
                    if (generalisedIpNetmask !== collisionDomainIpNetmask)
                        this.errors.push("machine: " + machine.name + " ip: " + ipNetmask + " device: " + device + 
                                         " not compatible with calculated collisioDomain: " + collisionDomain + " ipNetmask: " + collisionDomainIpNetmask);
                }
                else ArrayMap.put(this.collisionDomains2ipNetmask, collisionDomain, generalisedIpNetmask);
            }
        }
    }

    addMachine(machineName) {
        let machine = new Machine(machineName);
        this.machineNames.push(machineName);
        this.machines.push(machine);
    }

    addCollisionDomain(collisionDomainName, ipNetmask) {
        this.collisionDomains.push(collisionDomainName);
        ArrayMap.put(this.collisionDomains2ipNetmask, collisionDomainName, ipNetmask);
    }

    addLinkFromMachineToCollisionDomain(machineName, collisionDomainName, ipNetmask) {
        this.getMachine(machineName).addLink(collisionDomainName, ipNetmask);
        let ip = ipNetmask.split("/")[0];
        this.allIps.push(ip)
    }

    removeLinkFromMachineToCollisionDomain(machineName, collisionDomainName) {
        let machine = this.getMachine(machineName)
        let devices = ArrayMap.keys(this.device2collisionDomain);
        for (let i=0; i<devices.length; i++) {
            let device = devices[i];
            if (ArrayMap.get(machine.device2collisionDomain, device) === collisionDomainName) {
                var ipNetmask = ArrayMap.get(machine.device2ipNetmask, device)
                break
            }
        }
        let index = this.allIps.indexOf(ipNetmask);
        this.allIps.splice(index, 1);
        machine.removeLinkWithCollisionDomain(collisionDomainName)
    }

    hasMachine(name) {
        return this.machineNames.includes(name);
    }

    hasCollisionDomain(name) {
        return this.collisionDomains.includes(name);
    }

    hasIp(ip) {
        return this.allIps.includes(ip);
    }

    removeMachine(machineName) {
        let machine = this.getMachine(machineName);
        let i = this.machines.indexOf(machine);
        let j = this.machineNames.indexOf(machineName);
        this.machines.splice(i, 1);
        this.machineNames.splice(j, 1);
    }

    removeCollisionDomain(collisionDomainName) {
        for (let i=0; i<this.machines.length; i++)
            this.machines[i].removeLinkWithCollisionDomain(collisionDomainName);
    }
}

export { Machine, Lab }