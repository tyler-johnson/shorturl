import express from "express";
import redis from "redis";
import promisifyAll from "es6-promisify-all";
import api from "./api";
import redirect from "./redirect";
import error from "./error";

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

export default function createApp({redis:redis_opts}) {
	let app = express();

	app.db = redis.createClient(redis_opts);

	app.get("/", api);
	app.get(/^\/([a-zA-Z0-9]+)$/, redirect);
	app.use(error);

	return app;
}
