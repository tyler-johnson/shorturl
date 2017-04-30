import minimist from "minimist";
import rc from "rc";
import {name,version} from "../package.json";

// using standard require so rollup doesn't include it
const createApp = require("./");

let argv = minimist(process.argv.slice(2), {
  boolean: [ "help", "version" ],
  alias: {
    h: "help", H: "help",
    v: "version", V: "version",
    c: "config",
    t: "title",
    "enableHome": "home",
    p: "port"
  }
});

if (argv.help) {
  console.log(`Usage: shorturl-server [OPTIONS]

Options
  -c, --config <file>   Set options via a JSON config file, relative to PWD.
  -p, --port <port>     The HTTP server port.
  --redis <url>         A Redis server connection string.
  --no-home             Disable the HTML website part of the server.
  -t, --title <title>   Set the title of server, displayed on the homepage
  --public <dir>        A path to a folder with static files to serve.
  -h, --help            Shows this message.
  -v, --version         Prints the name and version of this software.`);
  process.exit(0);
}

if (argv.version) {
  console.log("%s %s", name, version);
  process.exit(0);
}

const conf = rc("shorturl", {}, argv);

if (conf.production) {
  process.env.NODE_ENV = "production";
} else if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

let host, port;

if (conf.bind && typeof conf.bind === "string") {
  [host,port] = conf.bind.split(":");
}

if (!host) host = conf.host || "127.0.0.1";
if (!port) port = conf.port || process.env.PORT || "3000";

const app = createApp(conf);

app.listen(port, host, function() {
  const addr = this.address();
  console.log("Short URL server listening at http://%s:%s", addr.address, addr.port);
  console.log("Enter Ctrl-C to stop the server.");
}).on("error", function(e) {
  console.error(e.stack || e);
  process.exit(1);
});
