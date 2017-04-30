import {Router,static as serveStatic} from "express";
import {count} from "./shorten";
import hometpl from "./home.html";
import {name,version} from "../package.json";
import footer from "./footer.txt";

export default function({ public:publicDir, ...data }) {
  var router = new Router();

  router.get("/", async function(req, res, next) {
    try {
      res.send(hometpl({
        title: req.get("host") || name,
        tagline: "the best <b>url shortener</b> in the universe",
        footer,
        styles: "main.css",
        ...data,
        name, version,
        urlcount: await count(req.app.db)
      }));
    } catch(e) {
      next(e);
    }
  });

  if (publicDir) {
    router.use(serveStatic(publicDir));
  }

  router.get("/main.css", function(req, res) {
    res.sendFile(__dirname + "/styles.css");
  });

  return router;
}
