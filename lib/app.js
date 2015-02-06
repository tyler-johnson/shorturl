/** Dependencies **/

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
var count_cache;

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

	db.getAsync("url_count").then(wait(function(count) {
		count_cache = count;
		console.log("%d URLS in the database.", count);
	}));
}));

db.on("error", function(e) {
	console.error(e.stack || e.toString());
});

/** Routes **/

// asset routes
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

// home page template
var indexTpl;
fs.readFile(ezpath("index.html"), "utf-8", wait(function(err, src) {
	if (err) return console.error(err);
	indexTpl = _.template(src, { variable: "$" });
}));

// root route
app.get("/",

// create/lookup by URL
function(req, res, next) {
	var fullurl = req.query.u || req.query.url;
	if (!fullurl) return next();

	fullurl = cleanURL(fullurl);
	var hash = crypto.createHash("sha256").update(fullurl).digest("hex");

	// find existing
	db.hgetAsync("urls_by_hash", hash).then(function(existing) {
		if (existing) return JSON.parse(existing);

		// or add to the database
		return db.incrAsync("url_count").then(function(count) {
			count_cache = count;
			var id = base62.encode(count);
			var data = { f: fullurl, i: id, d: Date.now() };
			
			var save = db.multi();
			save.hset("urls_by_hash", hash, JSON.stringify(data));
			save.hset("hashes_by_id", id, hash);

			return Promise.promisify(save.exec, save)().return(data);
		});
	})

	// return the data
	.then(function(data) {
		res.send(parseData(data, req));
	})

	// catch errors
	.catch(next);
},

// reverse look up
function(req, res, next) {
	var id = req.query.id;
	if (!id) return next();

	getById(id).then(function(data) {
		if (data == null) throw { status: 404 };
		res.send(parseData(data, req));
	})
	.catch(next);
},

// home page route
function(req, res, next) {
	res.status(200);
	res.type("html");
	res.end(indexTpl({
		title: req.get("host") || pkg.name,
		version: pkg.version,
		gaid: process.env.GA_TRACKING_ID, // google analytics tracking ID
		url_count: count_cache
	}));
});

// main redirect route
app.get(/^\/([a-zA-Z0-9]+)$/, function(req, res, next) {
	getById(req.params[0]).then(function(data) {
		if (data == null) throw { status: 404 };
		
		res.status(303);
		res.type("txt");
		res.set("Location", data.f);
		res.end("Redirecting you to '" + data.f + "'.");
	})
	.catch(next);
});

// default route is a 404
app.use(function(req, res) {
	res.sendStatus(404);
});

// error route
app.use(function(e, req, res, next) {
	var code = e.status || (e.cause && e.cause.status);

	if (typeof code === "number" && !isNaN(code) && code > 0) {
		if (e.message) {
			res.status(code);
			res.type("txt");
			res.end(e.message);
		} else {
			res.sendStatus(code);
		}

		return;
	}

	console.log(e.stack || e.toString());
	res.sendStatus(500);
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

function parseData(data, req) {
	return {
		id: data.i,
		shorturl: idToURL(data.i, req),
		original: data.f,
		created: new Date(data.d)
	}
}

function getById(id) {
	// id -> hash
	return db.hgetAsync("hashes_by_id", id)

	// hash -> URL
	.then(function(hash) {
		if (hash == null) return;

		return db.hgetAsync("urls_by_hash", hash).then(JSON.parse);
	});
}

function idToURL(id, req) {
	return (req ? "http" + (req.secure ? "s" : "") + "://" + (req.get("host") || "") : "") + "/" + id;
}

function createBundle(jsfile, options) {
	var bundle, compile;
	
	options = options || {};
	
	if (options.watch) {
		bundle = browserify(_.defaults({}, options, watchify.args));
		watchify(bundle);

		bundle.on("update", function(ids) {
			compile.clearCache();
		});
	} else {
		bundle = browserify(options);
	}

	bundle.add(jsfile);

	compile = compilify(function() {
		return new Promise(function(resolve, reject) {
			bundle.bundle(function(err, src) {
				if (err) return reject(err);
				src = src.toString("utf-8");
				if (options.minify) src = uglify.minify(src, { fromString: true }).code;
				resolve(src);
			});
		});
	});

	// run immediately on startup
	compile.run().then(wait(function() {
		console.log("Bundled: '%s'", path.relative(ezpath(".."), jsfile));
	}), console.error.bind(console));

	return function(req, res, next) {
		compile.run().then(function(src) {
			res.status(200);
			res.type("js");
			res.send(src);
		}, next);
	}
}

function compilify(compile) {
	var running = false,
		cbs = [],
		cache;

	function invoke() {
		var _cbs = cbs,
			args = _.toArray(arguments);
		
		cbs = [];
		args.unshift(_cbs);

		return _.invoke.apply(_, args);
	}

	return {
		clearCache: function() {
			if (cache == null) return false;
			cache = null;
			return true;
		},
		run: function() {
			if (!running && cache) return Promise.resolve(cache);

			var promise = new Promise(function(resolve, reject) {
				cbs.push({ resolve: resolve, reject: reject });
			});

			if (!running) {
				running = true;

				Promise.cast(compile()).then(function(src) {
					invoke("resolve", cache = src);
				}, function(e) {
					invoke("reject", e);
				}).finally(function() {
					running = false;
				});
			}
			
			return promise;
		}
	}
}