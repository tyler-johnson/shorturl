var redis = require("romis");

App.defaults("redis", process.env.REDIS_URL);
var opts = App.get("redis");
var args = [];
var auth;

if (opts) {
	if (typeof opts === "object") {
		auth = opts.auth;
		args = [
			opts.port || 6379,
			opts.host || '127.0.0.1'
		];
	} else if (typeof opts === "string") {
		args = [ opts ];
	}
}

var db = App.db = redis.createClient.apply(redis, args);

if (auth) db.auth(auth);

db.once("ready", App.wait(function() {
	App.log.info("Connected to Redis server.");
}));

db.on("error", function(e) {
	App.error(e);
});

var channel = App.channel = db.duplicate();

App.subscribe = function(name, onMessage, onReady) {
	var onSubscribe;
	channel.on("subscribe", onSubscribe = function(n) {
		if (n === name) {
			channel.removeListener("subscribe", onSubscribe);
			if (onReady) onReady();
		}
	});

	channel.on("message", function(n, message) {
		if (n === name && onMessage) onMessage(message);
	});

	channel.subscribe(name);
};
