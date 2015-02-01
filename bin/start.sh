#!/bin/bash

# variables
export NODE_ENV=production
export PORT=80

# make sure any existing instances are stopped
./bin/stop.sh

# install dependencies
npm install

# start the server
node ./lib/app.js > ./main.log 2>&1 &

# log PID for stopping
mainPID=$!
echo $! >> .pid

# logging
echo "PIDs = $mainPID"
echo "Logging output to ./main.log"
echo "Stop with 'npm stop'"
echo ""
