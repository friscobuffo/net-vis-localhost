const fs = require('fs')
const path = require('path');
const express = require('express');
// const spawn = require('child_process').spawn;

function get(array, key) {
    for (let i=0; i<array.length; i++) {
        let element = array[i];
        if (element.key === key) return element.value;
    }
}

function keys(array) {
    let keys = new Array();
    for (let i=0; i<array.length; i++) {
        let element = array[i];
        keys.push(element.key)
    }
    return keys;
}

const PORT = 8000;
const thisDirectoryPath = process.cwd();
const staticDirectoryPath = path.join(__dirname, "static");

const indexPath = path.join(staticDirectoryPath, 'index.html');

let html = fs.readFileSync(indexPath, 'utf8');

function walk(startingAbsolutePath, startingRelativePath) {
    var results = []
    let fileNamesList = fs.readdirSync(startingAbsolutePath);
    for (let i=0; i<fileNamesList.length; i++) {
        let file = fileNamesList[i];
        let stat = fs.statSync(startingAbsolutePath+"/"+file);
        if (stat && stat.isDirectory()) {
            subResult = walk(startingAbsolutePath+"/"+file, startingRelativePath + file + "/");
            results = results.concat(subResult);
        }
        else {
            results.push(startingRelativePath + file);
        }
    }
    return results;
}

fileNamesList = walk(thisDirectoryPath, "");

app = express();

app.use(express.json());
app.use("/network", express.static(thisDirectoryPath));
app.use("/static", express.static(staticDirectoryPath));
app.get("/", (req, res) => res.send(html));

app.get("/filesList", (req, res) => res.send(fileNamesList));

app.get("/close", (req, res) => {
	server.close();
	res.send("closed");
});

app.post('/updateLab', (req, res) => {
    let labJson = req.body;
    updateLab(labJson);
    res.send("good");
})

const server = app.listen(PORT, () => console.log(`hosting on http://localhost:${PORT}`));

// spawn('open', [`http://localhost:${PORT}`]);

const newNetworkPath = path.join(process.cwd(), "newNetwork");

function updateLab(labJson) {
    console.log("updating lab");
    if (fs.existsSync(newNetworkPath))
        fs.rmSync(newNetworkPath, { recursive: true }); 
    fs.mkdirSync(newNetworkPath);
    let labConf = "";
    for (let i=0; i<labJson.machines.length; i++) {
        let startupFile = "";
        let machine = labJson.machines[i];
        let keysArray = keys(machine.device2collisionDomain);
        for (let j=0; j<keysArray.length; j++) {
            // lab.conf updates
            let key = `eth${j}`;
            let collisionDomain = get(machine.device2collisionDomain, key);
            let labConfLine = `${machine.name}[${j}]=${collisionDomain}\n`;
            labConf += labConfLine;
            // .startup file
            let ip = get(machine.device2ipNetmask, key);
            if (ip) startupFile += `ip address add ${ip} dev ${key}\n`;
        }
        labConf += "\n";
        let startupFilePath = path.join(newNetworkPath, machine.name+".startup")
        fs.writeFileSync(startupFilePath, startupFile);
    }
    let labConfFilePath = path.join(newNetworkPath, "lab.conf");
    fs.writeFileSync(labConfFilePath, labConf);
    console.log("updated\n");
}

// process.stdin.resume(); // so the program will not close instantly

// function exitHandler(options, exitCode) {
//     server.close();
//     if (options.cleanup) console.log('clean');
//     if (exitCode || exitCode === 0) console.log(exitCode);
//     if (options.exit) process.exit();
// }

// // do something when app is closing
// process.on('exit', exitHandler.bind(null,{cleanup:true}));

// // catches ctrl+c event
// process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
// process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// // catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));