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

export default function(tpl_opts) {
	var router = new Router();

	router.get("/", async function(req, res, next) {
		try {
			let title = (req.get("host") || pkg.name);

			res.send(html({
				title: title + " - the best url shortener",
				scripts: "main.js",
				styles: "main.css",
				appdata: {
					title,
					urlcount: await count(req.app.db),
					...pick(pkg, "name", "version"),
					...tpl_opts
				}
			}));
		} catch(e) {
			next(e);
		}
	});

	router.get("/main.(js|css)", function(req, res) {
		res.sendFile(__dirname + "/dist/client." + req.params[0]);
	});

	return router;
}
