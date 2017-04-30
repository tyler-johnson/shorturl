import {getById} from "./shorten";

export default async function(req, res, next) {
  try {
    let data = await getById(req.app.db, req.params[0]);
    if (data == null) throw { status: 404 };

    res.status(301);
    res.type("txt");
    res.set("Location", data.f);
    res.end("Redirecting you to '" + data.f + "'.");
  } catch(e) {
    next(e);
  }
}
