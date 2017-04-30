import * as shorten from "./shorten";

// create/lookup by URL
export default async function(req, res, next) {
  try {
    let fullurl = req.query.u != null ? req.query.u : req.query.url;
    if (fullurl != null) {
      res.set("Access-Control-Allow-Origin", "*");
      const data = await shorten.fetch(req.app.db, fullurl);
      const count = await shorten.count(req.app.db);
      res.json(parseData(data, req, count));
      return;
    }

    let id = req.query.id;
    if (id) {
      let data = await shorten.getById(req.app.db, id);
      if (data == null) throw { status: 404 };
      res.json(parseData(data, req));
      return;
    }

    if (req.query.count != null) {
      const count = await shorten.count(req.app.db);
      res.json({ ok: true, count });
      return;
    }

    next();
  } catch(e) {
    next(e);
  }
}

function parseData(data, req, count) {
  return {
    ok: true,
    id: data.i,
    shorturl: idToURL(data.i, req),
    original: data.f,
    created: new Date(data.d),
    count
  };
}

function idToURL(id, req) {
  return (req ? "http://" + (req.get("host") || "") : "") + "/" + id;
}
