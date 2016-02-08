#!/bin/bash

BIN=node_modules/.bin

if [ "${TRAVIS_PULL_REQUEST}" != "false" ]
then
	echo "Skipping full deploy since this is a pull request."
	echo "Attempting a simple pack instead."
	$BIN/superfast pack
	exit 0
fi

cat "${DOKKU_PRIVATE_KEY}" > deploy_key.pem
ssh-add deploy_key.pem
git clone dokku@$DOKKU_HOST:$DOKKU_APPNAME deploy
cd deploy
npm run clean
cd ..
$BIN/superfast pack deploy -y
cd deploy
git status
