import minimist from "minimist";
import {merge} from "lodash";
import {readFileSync} from "fs";
import config from "cloud-env";

// using standard require so rollup doesn't include it
const createApp = require("./");

let argv = minimist(process.argv.slice(2), {
	string: [ "config", "title", "host", "port" ],
	boolean: [ "help", "version", "production", "compress" ],
	alias: {
		h: "help", H: "help",
		v: "version", V: "version",
		x: "compress",
		t: "title"
	}
});

if (argv.help) {
	console.log("halp plz");
	process.exit(0);
}

if (argv.version) {
	const pkg = JSON.parse(readFileSync(__dirname + "/package.json", "utf8"));
	console.log("%s %s", pkg.name, pkg.version || "edge");
	process.exit(0);
}

if (argv.config) {
	merge(argv, JSON.parse(readFileSync(argv.config, "utf8")));
}

process.env.NODE_ENV = argv.production ? "production" : (process.env.NODE_ENV || "development");

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
