class Machine {
    constructor(name) {
        this.name = name;
        this.device2collisionDomain = new Array(); // actually a MAP implemented with an array
        this.device2ipNetmask = new Array(); // actually a MAP implemented with an array
        this.type; // router - pc
    }
}

class Lab {
    constructor(filesListUrl, networkUrl) {
        this.networkUrl = networkUrl;
        this.customLans = []; // lans not belonging to any collision domain
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
            this.assignMachinesType();
        }
        if (this.errors.length)
            console.log(this.errors);
    }

    readNetworkFile(networkFilePath) {
        return readFile(this.networkUrl + networkFilePath);
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
            machine.type = "computer";
            let startupFile = this.readNetworkFile(fileName);
            let startupFileLines = startupFile.split("\n");
            for (let j=0; j<startupFileLines.length; j++) {
                let line = startupFileLines[j];
                if (!line) continue;
                if (line.startsWith("systemctl")) continue;
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

    assignMachinesType() {
        for (let i=0; i<this.machines.length; i++) {
            let machine = this.machines[i];
            if (machine.device2collisionDomain.length > 1) machine.type = "router";
            else machine.type = "computer";
        }
    }
}
