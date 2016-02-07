#!/bin/bash

if [ "${TRAVIS_PULL_REQUEST}" != "false" ]
then
	>&2 echo "inside a pull request so refusing to deploy"
	exit 1
fi

echo "here"
