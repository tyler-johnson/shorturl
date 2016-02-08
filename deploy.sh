#!/bin/bash

BIN=node_modules/.bin

if [ "${TRAVIS_PULL_REQUEST}" != "false" ]
then
	echo "Skipping full deploy since this is a pull request."
	echo "Attempting a simple pack instead."
	$BIN/superfast --boring pack
	exit 0
fi

# prep the access key
echo "$DOKKU_PRIVATE_KEY" > deploy_key.pem
chmod 600 deploy_key.pem
eval "$(ssh-agent -s)" # start the ssh agent
ssh-add deploy_key.pem
ssh-add -l

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

git status
