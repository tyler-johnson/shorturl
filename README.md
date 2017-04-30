# URL Shortener Service

[![npm](https://img.shields.io/npm/v/@mrgalaxy/shorturl.svg)](https://www.npmjs.com/package/@mrgalaxy/shorturl) [![Build Status](https://travis-ci.org/tyler-johnson/shorturl.svg?branch=master)](https://travis-ci.org/tyler-johnson/shorturl)

This is the source code for my URL shortener. I made it as an experiment to see how URL shorteners work under the hood. The source is licensed under MIT so feel free to hack away!

Check out the live version: <https://yuk.nu>

### Install

Install globally using NPM.

```bash
npm i @mrgalaxy/shorturl -g
```

Check that the tool was installed correctly.

```bash
shorturl-server --help
```

### Usage

To run a local server, ensure a local [Redis server](https://redis.io) has been started at the default port. Then run the following command:

```bash
shorturl-server
```

This will start a local server at <http://localhost:3000>.
