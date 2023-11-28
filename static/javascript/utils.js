function readFile(fileUrl) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", fileUrl, false);
    xhr.send(null);
    if (xhr.status === 200)
        return xhr.responseText;
}

function sendPost(jsonObject, postUrl) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", postUrl, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(jsonObject));
}

// map implementation with array functions
class ArrayMap {
    static put(array, key, value) {
        for (let i=0; i<array.length; i++) {
            let element = array[i];
            if (element.key === key) {
                element.value = value;
                return;
            }
        }
        let newElement = {key: key, value: value};
        array.push(newElement);
    }
    static get(array, key) {
        for (let i=0; i<array.length; i++) {
            let element = array[i];
            if (element.key === key) return element.value;
        }
    }
    static has(array, key) {
        for (let i=0; i<array.length; i++) {
            let element = array[i];
            if (element.key === key) return true;
        }
        return false;
    }
    static keys(array) {
        let keys = new Array();
        for (let i=0; i<array.length; i++) {
            let element = array[i];
            keys.push(element.key)
        }
        return keys;
    }
    static values(array) {
        let values = new Array();
        for (let i=0; i<array.length; i++) {
            let element = array[i];
            values.push(element.value)
        }
        return values;
    }
}

// decimal to binary
function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}

// binary to decimal
function bin2dec(bin) {
    return parseInt(bin, 2);
}

// netmask value in number to actual binary netmask
// example 26 -> 11111111.11111111.11111111.11000000
function netmask2bitNetmask(n) {
    let netmask = "";
    for (let i=0; i<n; i++)
        netmask += "1";
    for (let i=0; i<32-n; i++)
        netmask += "0";
    let output = "";
    for (let i=0; i<32; i++) {
        output += netmask[i];
        if (i==7 || i==15 || i==23) output += ".";
    }
    return output;
}

// binary ip to decimal ip
// example 
function ip2bitIp(ip) {
    let subIps = ip.split(".");
    let ipBit = "";
    for (let i=0; i<4; i++) {
        let subIpBit = dec2bim(subIps[i]);
        for (let j=0; j<8-subIpBit.length; j++) {
            subIpBit = "0"+subIpBit;
        }
        ipBit += subIpBit;
        if (i!=3) ipBit += ".";
    }
    return ipBit;
}

// given a machine ip and his netmask, generalises the ip and
// gives the lan's ip
function generaliseIp(ip, netmask) {
    let subIps = ip.split(".");
    let subNetmasks = netmask2bitNetmask(netmask).split(".");
    let generalisedIp = "";
    for (let i=0; i<4; i++) {
        let subIp = subIps[i];
        let subNetmask = bin2dec(subNetmasks[i]);
        let subGeneralisedIp = (subIp & subNetmask)
        generalisedIp += subGeneralisedIp
        if (i!=3) generalisedIp += ".";
    }
    return generalisedIp;
}

// checks if machine sub ip (example .7 or .12.23 etc) is compatible with lan's ip/netmask
// if yes returns the machine ip, if no returns undefined
// accepts sub ips even without the first dot "." (example 7 or 12.23)
// in theory sub ip can be a full ip, not tested tho
function subIpCompatible(ip, netmask, wantedSubIp) {
    let wantedSubIps = wantedSubIp.split(".");
    let subIps = ip.split(".");
    let subDots = wantedSubIps.length;
    let wantedIp = "";
    let j=0;
    if (wantedSubIp[0] === ".") {
        subDots--;
        j++;
    }
    for (let i=0; i<4; i++) {
        if (i<4-subDots) wantedIp += subIps[i];
        else {
            wantedIp += wantedSubIps[j];
            j++;
        }
        if (i<3) wantedIp += ".";
    }
    let bitSubNetmasks = netmask2bitNetmask(netmask).split(".");
    let wantedSubIpsComplete = wantedIp.split(".")
    for (let i=0; i<4; i++)
        if (subIps[i] != (bin2dec(bitSubNetmasks[i]) & (wantedSubIpsComplete[i]))) return;
    return wantedIp;
}

// checks if ip is actually written as an ip (12.12.12.12/12)
// (not like 12.12/12 or pippopluto)
function ipNetmaskMakesSense(ipNetmask) {
    let regexForIp = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/


}

export { readFile, sendPost, ArrayMap, generaliseIp }