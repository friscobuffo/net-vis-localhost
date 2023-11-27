# Network Visualization for Kathara labs

This script parses (and generates) the lab.conf file and all the .startup files to visualize the network.
It is useful to check if those files are properly configured, but also to make them from scratch.

How to build the executable for linux:
    - install nodejs 18
    - use npm to install globally pkg
        (sudo npm install -g pkg)
    - console -> navigate to net-vis-localhost folder
    - pkg .
    - binary will be in out folder

How to use:
    - place net-vis-localhost file in lab folder
    - open terminal
    - ./net-vis-localhost
    - open browser
    - navigate to http://localhost:8000/

How to add a node (machine or collision domain):
    - configure the node stuff in the add node menu
    - click to the green top left + button (Add Node)
    - click where to add the machine/collision domain

How to add a link:
    - configure the link ip (example: 12.12.12.12 or even just the sub-ip like .12)
    - click to the blue top left arrow button (Add Edge)
    - click on a machine and drag the curson to a collision domain
        (it will check if the link is compatible with collision domain ip/netmask)

To save changes made:
    - click on Update Lab button
    - new lab.conf and .startup files will be in newNetwork folder

Known bugs:
    assumes in .startup files there are no commands beside systemctl ones and ip address add ones