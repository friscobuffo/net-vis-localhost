# Network Visualization for Kathara labs

This script parses (and **generates**) the lab.conf file and all the .startup files to visualize the network.  
It is useful to check if those files are properly configured, but also to make them from scratch.

Binaries are already built for linux and windows machines  
You can find them in the `out` directory  

How to **build the executables** (in linux machine):  
 - install nodejs 18
 - use npm to install globally pkg
    - `sudo npm install -g pkg`
 - console -> navigate to net-vis-localhost folder
    - `pkg .`
 - binary will be in `out` directory

How to **use**:
 - place net-vis-localhost file in lab folder
 - open terminal
 - linux
    - `./net-vis-localhost-linux`
 - windows
    - `./net-vis-localhost-win.exe`
 - open browser
 - navigate to `http://localhost:8000/`

After navigating to the link, it will display the network if there is one.  
If the network is not displayed as expected, most likely there are errors somewhere in the `lab.conf` or in some `.startup` file

How to **add a node** (machine or collision domain):
 - configure the node stuff in the add node menu
 - click to the green top left + button (Add Node)
 - click where to add the machine/collision domain

How to **add a link**:
 - configure the link ip (example: 12.12.12.12 or even just the sub-ip like .12)
 - click to the blue top left arrow button (Add Edge)
 - click on a machine and drag the curson to a collision domain  
    (it will check if the link is compatible with collision domain ip/netmask)
 - machine devices for the new link will be assigned incrementally  
    (first link: eth0, second link: eth1, etc.)

How to **save changes** made:
 - click on Update Lab button
 - new `lab.conf` and `.startup` files will be in `newNetwork` folder
