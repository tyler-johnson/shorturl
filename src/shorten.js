import url from "url";
import crypto from "crypto";
import base62 from "base62";
import promisify from "es6-promisify";

const MAX_LENGTH = 1024; // 1KB

export async function fetch(db, fullurl) {
  // validate the url
  fullurl = cleanURL(fullurl);
  if (!fullurl) throw { status: 400, message: "Invalid or blacklisted URL." };

  // generate hash
  let hash = crypto.createHash("sha256").update(fullurl).digest("hex");

  // find and return existing
  let existing = await promisify(db.hget, db)("urls_by_hash", hash);
  if (existing) return JSON.parse(existing);

  // generate a new entry based on the current url count
  let c = await promisify(db.incr, db)("url_count");
  let id = base62.encode(c);
  let data = { f: fullurl, i: id, d: Date.now() };

  // publish everything simultaneously
  let save = db.multi();
  save.hset("urls_by_hash", hash, JSON.stringify(data));
  save.hset("hashes_by_id", id, hash);

  await promisify(save.exec, save)();

  return data;
}

export async function getById(db, id) {
  let hash = await promisify(db.hget, db)("hashes_by_id", id);
  if (hash == null) return;
  let data = await promisify(db.hget, db)("urls_by_hash", hash);
  return JSON.parse(data);
}

export async function count(db) {
  return await promisify(db.get, db)("url_count");
}

export function cleanURL(fullurl) {
  if (typeof fullurl !== "string" ||
    !fullurl.length || fullurl.length > MAX_LENGTH) return false;

  var uri = url.parse(fullurl, false, true);

  // this probably means no leading protocol
  if (uri.host == null) {
    uri = url.parse("http://" + fullurl, false, true);
  }

  // if (App.blacklist.some(function(d) {
  //   return d.test(uri.host);
  // })) return false;

  // default protocol is http
  if (uri.protocol == null) uri.protocol = "http:";

  // reconstruct full url
  return uri.protocol + "//" + uri.host + (uri.path || "");
}
