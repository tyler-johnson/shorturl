import express from "express";
import redis from "redis";
import promisifyAll from "es6-promisify-all";
import api from "./api";
import redirect from "./redirect";
import error from "./error";
import home from "./home";

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

export default function createApp({ redis:redis_opts, title, enableHome=true }) {
	let app = express();

	if (redis_opts instanceof redis.RedisClient) {
		app.db = redis_opts;
	} else {
		app.db = redis.createClient(redis_opts);
	}

	app.get("/", api);
	app.get(/^\/([a-zA-Z0-9]+)$/, redirect);
	if (enableHome) app.use(home({title}));
	app.use(error);

	return app;
}
