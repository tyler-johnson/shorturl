import minimist from "minimist";
import {merge,repeat} from "lodash";
import {readFileSync} from "fs";
import config from "cloud-env";

// using standard require so rollup doesn't include it
const createApp = require("./");

let argv = minimist(process.argv.slice(2), {
	string: [ "title", "host", "port" ],
	boolean: [ "help", "version", "home" ],
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
	console.log(`
$ shorturl-server [OPTIONS]

	-c, --config <file>   Set options via a JSON config file, relative to PWD.
	-t, --title <title>   Set the title of server, displayed on the homepage
	-p, --port <port>     The HTTP server port.
	--no-home             Disable the HTML website part of the server.
	--redis <url>         A Redis server connection string.
	-h, --help            Shows this message.
	-v, --version         Prints the name and version of this software.
`.replace(/^\t+/gm, (m) => repeat("  ", m.length)));
	process.exit(0);
}

if (argv.version) {
	const pkg = JSON.parse(readFileSync(__dirname + "/package.json", "utf8"));
	console.log("%s %s", pkg.name, pkg.version || "edge");
	process.exit(0);
}

if (argv.config) {
	let src;
	try { src = readFileSync(typeof argv.config === "boolean" ? "shorturl.config.json" : argv.config, "utf8"); }
	catch(e) { e; }
	if (src) merge(argv, JSON.parse(src));
}

const app = createApp(argv);

app.listen(
	argv.port || config.PORT || 8080,
	argv.host || config.HOST || "127.0.0.1",
	function() {
		const addr = this.address();
		console.log("Short URL service%s listening at http://%s:%s", argv.title ? ` '${argv.title}'` : "", addr.address, addr.port);
		console.log("Enter Ctrl-C to stop the server.");
	}
).on("error", function(e) {
	console.error(e.stack || e);
	process.exit(1);
});
