var _ = require("underscore"),
	Promise = require("bluebird"),
	express = require("express"),
	redis = require("redis"),
	morgan = require("morgan"),
	crypto = require("crypto"),
	url = require("url"),
	base62 = require('base62'),
	browserify = require("browserify"),
	watchify = require("watchify"),
	path = require("path"),
	uglify = require("uglify-js"),
	fs = Promise.promisifyAll(require("fs"));

var pkg = require("../package.json");

/** Express Server Setup **/
var app = express();

var wait = asyncWait(function() {
	var port = process.env.PORT || 3000;
	var server = app.listen(port, function() {
		console.log("HTTP server listening on port %s.", port);
	});

	server.on("error", function(e) {
		console.error(e.stack || e.toString());
		process.exit(1);
	});
});

app.enable('trust proxy');
app.use(morgan(app.get("env") === "development" ? "dev" : "short"));

/** Redis Setup **/
var db = Promise.promisifyAll(redis.createClient(
	process.env.REDIS_PORT || 6379,
	process.env.REDIS_HOST || '127.0.0.1'
));

if (process.env.REDIS_AUTH) {
	db.auth(process.env.REDIS_AUTH);
}

db.once("ready", wait(function() {
	console.log("Connected to Redis server.");
}));

db.on("error", function(e) {
	console.error(e.stack || e.toString());
});

/** Routes **/
app.get("/_assets/main.js", createBundle(ezpath("../client/index.js"), {
	watch: app.get("env") === "development",
	debug: app.get("env") === "development",
	minify: app.get("env") !== "development"
}));

app.use("/_assets", express.static(ezpath("../public"), {
	dotfiles: 'ignore',
	maxAge: 1000 * 60 * 60 * 24 * 14, // 2 weeks
	redirect: false
}));

app.get("/", function(req, res, next) {
	var fullurl = req.query.u || req.query.url;
	if (!fullurl) return next();

	fullurl = cleanURL(fullurl);
	var hash = crypto.createHash("sha256").update(fullurl).digest("hex");

	// find existing
	db.hgetAsync("urls_by_hash", hash).then(function(existing) {
		if (existing) return JSON.parse(existing);

		// or add to the database
		return db.incrAsync("url_count").then(function(count) {
			var id = base62.encode(count);
			var data = { full: fullurl, id: id, created: Date.now() };

			return Promise.all([
				db.hsetAsync("urls_by_hash", hash, JSON.stringify(data)),
				db.hsetAsync("hashes_by_id", id, hash)
			]).return(data);
		});
	})

	// return the short url
	.then(function(data) {
		res.send({
			id: data.id,
			shorturl: idToURL(data.id, req),
			original: data.full,
			created: new Date(data.created)
		});
	});
});

var indexTpl = _.template(fs.readFileSync(ezpath("index.html"), "utf-8"), { variable: "$" });

app.get("/", function(req, res, next) {
	res.status(200);
	res.type("html");
	res.end(indexTpl({
		title: req.get("host") || pkg.name,
		version: pkg.version,
		gaid: process.env.GA_TRACKING_ID // google analytics tracking ID
	}));
});

app.get(/^\/([a-zA-Z0-9]+)$/, function(req, res, next) {
	getById(req.params[0]).then(function(data) {
		if (data == null) return res.sendStatus(404);
		res.status(303);
		res.type("txt");
		res.set("Location", data.full);
		res.end("Redirecting you to '" + data.full + "'.");
	});
});

app.get(/^\/-\/([a-zA-Z0-9]+)$/, function(req, res, next) {
	getById(req.params[0]).then(function(data) {
		if (data == null) return res.sendStatus(404);
		res.status(200);
		res.type("txt");
		res.send(data.full);
	});
});

/** Helpers **/
function ezpath(p) {
	return path.resolve(__dirname, p);
}

function asyncWait(onEmpty) {
	var counter = 0;
	setTimeout(callback(), 0);
	return callback;
 
	function callback(cb) {
		var called = false;
		++counter;
		
		return function() {
			if (called) return;
			called = true;
			--counter;
			if (typeof cb === "function") cb.apply(this, arguments);
			if (!counter && typeof onEmpty === "function") onEmpty();
			return arguments.length > 1 ? _.toArray(arguments) : arguments[0];
		}
	}
}

function cleanURL(fullurl) {
	var uri = url.parse(fullurl, false, true);

	// this probably means no leading protocol
	if (uri.host == null) {
		uri = url.parse("http://" + fullurl, false, true);
	}

	// default protocol is http
	if (uri.protocol == null) uri.protocol = "http:";

	// reconstruct full url	
	return uri.protocol + "//" + uri.host + (uri.path || "");
}

function getById(id) {
	// id -> hash
	return db.hgetAsync("hashes_by_id", id)

	// hash -> URL
	.then(function(hash) {
		if (hash == null) return;

		return db.hgetAsync("urls_by_hash", hash).then(function(data) {
			return JSON.parse(data);
		});
	});
}

function idToURL(id, req) {
	return "http" + (req.secure ? "s" : "") + "://" + (req.get("host") || "") + "/" + id;
}

function createBundle(jsfile, options) {
	var bundle, cached_src;
	
	options = options || {};
	
	if (options.watch) {
		bundle = browserify(_.defaults({}, options, watchify.args));
		watchify(bundle);
	} else {
		bundle = browserify(options);
	}

	bundle.add(jsfile);

	bundle.on("update", function(ids) {
		cached_src = null;
	});

	return function(req, res, next) {
		function done(src) {
			res.set("Content-Type", "application/javascript");
			res.status(200);
			res.send(src);
		}

		if (cached_src) return done(cached_src);

		bundle.bundle(function(err, src) {
			if (err) return next(err);
			src = src.toString("utf-8");
			if (options.minify) src = uglify.minify(src, { fromString: true }).code;
			done(cached_src = src);
		});
	}
}