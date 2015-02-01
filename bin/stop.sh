#!/bin/bash

# check for the pid file
if ! [[ -f .pid ]]; then
	exit 0
fi

# get PIDs
lines=$(<.pid)

# kills the running server(s) by PID
for i in "${lines[@]}"; do
	echo "kill -TERM $i"
	kill -TERM $i
done

# remove pid file
rm -f .pid