import express from "express";
import redis from "redis";
import api from "./api";
import redirect from "./redirect";
import error from "./error";
import home from "./home";

export default function createApp({ redis:redis_opts, enableHome=true, ...opts }) {
  let app = express();
  app.disable("x-powered-by");

  if (redis_opts instanceof redis.RedisClient) {
    app.db = redis_opts;
  } else {
    app.db = redis.createClient(redis_opts);
  }

  app.get("/", api);
  app.get(/^\/([a-zA-Z0-9]+)$/, redirect);
  if (enableHome) app.use(home(opts));
  app.use(error);

  return app;
}
