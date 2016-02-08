var crypto = require("crypto");
var url = require("url");
var base62 = require("base62");

var MAX_LENGTH = 1024; // 1KB

App.set("browserKeys", [].concat(App.get("browserKeys"), "site"));

// send url count to clients whenever it changes
// using redis pub/sub to properly scale
App.subscribe("url count", function(msg) {
	App.io.emit("url count", msg);
}, App.wait(function() {
	App.log.info("Subcribed to URL count.");
}));

// send the client the url count ondemand
App.phone.methods("urlCount", function() {
	return App.db.get("url_count");
});

// root route
App.router.get("/",

// create/lookup by URL
function(req, res, next) {
	var fullurl = req.query.u != null ? req.query.u : req.query.url;
	if (fullurl == null) return next();

	// CORS
	res.set("Access-Control-Allow-Origin", "*");

	// validate the url
	fullurl = cleanURL(fullurl);
	if (!fullurl) throw { status: 400, message: "Invalid or blacklisted URL." };

	// generate hash
	var hash = crypto.createHash("sha256").update(fullurl).digest("hex");

	// find existing
	App.db.hget("urls_by_hash", hash).then(function(existing) {
		if (existing) return JSON.parse(existing);

		// or add to the database
		return App.db.incr("url_count").then(function(count) {
			// count_cache = count;
			var id = base62.encode(count);
			var data = { f: fullurl, i: id, d: Date.now() };

			var save = App.db._redis.multi();
			save.hset("urls_by_hash", hash, JSON.stringify(data));
			save.hset("hashes_by_id", id, hash);

			return Promise.all([
				new Promise(function(resolve, reject) {
					save.exec(function(err) {
						if (err) reject(err);
						else resolve();
					});
				}),
				App.db.publish("url count", count)
			]).then(function() {
				return data;
			});
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
});

// main redirect route
App.router.get(/^\/([a-zA-Z0-9]+)$/, function(req, res, next) {
	getById(req.params[0]).then(function(data) {
		if (data == null) throw { status: 404 };

		res.status(303);
		res.type("txt");
		res.set("Location", data.f);
		res.end("Redirecting you to '" + data.f + "'.");
	})
	.catch(next);
});

// error route
App.router.use(function(e, req, res, next) {
	if (!e) return next();

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

function cleanURL(fullurl) {
	if (typeof fullurl !== "string" ||
		!fullurl.length || fullurl.length > MAX_LENGTH) return false;

	var uri = url.parse(fullurl, false, true);

	// this probably means no leading protocol
	if (uri.host == null) {
		uri = url.parse("http://" + fullurl, false, true);
	}

	if (App.blacklist.some(function(d) {
		return d.test(uri.host);
	})) return false;

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
	};
}

function getById(id) {
	// id -> hash
	return App.db.hget("hashes_by_id", id)

	// hash -> URL
	.then(function(hash) {
		if (hash == null) return;
		return App.db.hget("urls_by_hash", hash).then(JSON.parse);
	});
}

function idToURL(id, req) {
	return (req ? "http://" + (req.get("host") || "") : "") + "/" + id;
}
