import minimist from "minimist";
import {pick,defaults} from "lodash";
import {readFileSync} from "fs";

// using standard require so rollup doesn't include it
const createApp = require("./");

let argv = minimist(process.argv.slice(2), {
	string: [ "config" ],
	boolean: [ "help", "version", "production" ],
	alias: {
		h: "help", H: "help",
		v: "version", V: "version"
	}
});

if (argv.help) {
	console.log("halp plz");
	process.exit(0);
}

if (argv.version) {
	let pkg = require("./package.json");
	console.log("%s %s", pkg.name, pkg.version || "edge");
	process.exit(0);
}

if (argv.config) {
	defaults(argv, JSON.parse(readFileSync(argv.config, "utf8")));
}

process.env.NODE_ENV = argv.production ? "production" : (process.env.NODE_ENV || "development");

function panic(e) {
	console.error(e.stack || e);
	process.exit(1);
}

const VALID = [
	"redis"
];

const app = createApp(pick(argv, VALID));

const server = app.listen(argv.port || 3000, "127.0.0.1", () => {
	const addr = server.address();
	console.log("HTTP server listening at http://%s:%s", addr.address, addr.port);
});

server.on("error", panic);
