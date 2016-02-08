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
git clone dokku@$DOKKU_HOST:$DOKKU_APPNAME deploy
cd deploy

# build a new copy in the repo
npm run clean
cd ..
$BIN/superfast --boring pack deploy -y
cd deploy

cat package.json
git status

# exit if there are no changes to deploy
if git diff --quiet
then
	echo "No changes to deploy to production."
	exit 0
fi

# commit the changes and deploy
git add --all
git commit -m "deploy #$TRAVIS_BUILD_NUMBER"
git push origin master

# publish to NPM and clean up release
cd ..
npm publish
$BIN/semantic-release post
