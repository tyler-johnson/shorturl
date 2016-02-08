#!/bin/bash

BIN=node_modules/.bin

if [ "${TRAVIS_PULL_REQUEST}" != "false" ]
then
	echo "Skipping full deploy since this is a pull request."
	echo "Attempting a simple pack instead."
	$BIN/superfast --boring pack
	exit 0
fi

# clone the existing dokku repo
ssh-keyscan -t rsa $DOKKU_HOST >> ~/.ssh/known_hosts
git clone dokku@$DOKKU_HOST:$DOKKU_APPNAME deploy
cd deploy

# build a new copy in the repo
npm run clean
cd ..
$BIN/superfast --boring pack deploy -y
cd deploy

# exit if there are no changes
if git diff --quiet
then
	echo "No changes to deploy to production."
	exit 0
fi

git add --all
git commit -m "continuous deploy $(date '+%Y-%m-%d %H:%M:%S')"
git push origin master
