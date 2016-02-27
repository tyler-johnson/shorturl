import {Router} from "express";
import {readFileSync} from "fs";
import {pick} from "lodash";
import {count} from "./shorten";

const pkg = JSON.parse(readFileSync(__dirname + "/package.json", "utf8"));

function style(s) {
	return `<link rel="stylesheet" href="${s}" type="text/css" />`;
}

function script(s) {
	return `<script type="text/javascript" src="${s}"></script>`;
}

function html(opts={}) {
	let {styles,scripts,title="",appdata={}} = opts;
	appdata = JSON.stringify(new Buffer(JSON.stringify(appdata), "utf8").toString("base64"));

	return `<!DOCTYPE html>

<html lang="en-US">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${title}</title>
		${[].concat(styles).filter(Boolean).map(style).join("\n")}
	</head>
	<body>
		<script type="text/javascript">var APPDATA = JSON.parse(atob(${appdata}));</script>
		${[].concat(scripts).filter(Boolean).map(script).join("\n")}
	</body>
</html>`;
}

var router = new Router();
export default router;

router.get("/", async function(req, res, next) {
	try {
		res.send(html({
			title: (req.get("host") || pkg.name) + " - the best url shortener",
			scripts: "main.js",
			styles: "main.css",
			appdata: {
				urlcount: await count(req.app.db),
				...pick(pkg, "name", "version")
			}
		}));
	} catch(e) {
		next(e);
	}
});

router.get("/main.(js|css)", function(req, res) {
	res.sendFile(__dirname + "/dist/client." + req.params[0]);
});
