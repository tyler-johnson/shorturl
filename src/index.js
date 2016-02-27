import express from "express";
import redis from "redis";
import promisifyAll from "es6-promisify-all";
import api from "./api";
import redirect from "./redirect";
import error from "./error";
import home from "./home";
import compression from "compression";

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

export default function createApp({redis:redis_opts,compress=true}) {
	let app = express();

	if (redis_opts instanceof redis.RedisClient) {
		app.db = redis_opts;
	} else {
		app.db = redis.createClient(redis_opts);
	}

	if (process.env.NODE_ENV === "production") {
		if (compress) app.use(compression());
	}

	app.get("/", api);
	app.get(/^\/([a-zA-Z0-9]+)$/, redirect);
	app.use(home);
	app.use(error);

	return app;
}
