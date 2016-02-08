#!/bin/bash

BIN=node_modules/.bin

if [ "${TRAVIS_PULL_REQUEST}" != "false" ]
then
	echo "Skipping full deploy since this is a pull request."
	echo "Attempting a simple pack instead."
	$BIN/superfast --boring pack
	exit 0
fi

# bump the version
$BIN/semantic-release pre

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

# commit the changes and deploy
git add --all
git commit -m "deploy #$TRAVIS_BUILD_NUMBER"
git push origin master

# clean up release
cd ..
$BIN/semantic-release post
