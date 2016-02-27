import * as shorten from "./shorten";

// create/lookup by URL
export default async function(req, res, next) {
	try {
		let fullurl = req.query.u != null ? req.query.u : req.query.url;
		if (fullurl != null) {
			res.set("Access-Control-Allow-Origin", "*");
			res.send(parseData(await shorten.fetch(req.app.db, fullurl), req));
			return;
		}

		let id = req.query.id;
		if (id) {
			let data = await shorten.getById(req.app.db, id);
			if (data == null) throw { status: 404 };
			res.send(parseData(data, req));
			return;
		}

		next();
	} catch(e) {
		next(e);
	}
}

function parseData(data, req) {
	return {
		id: data.i,
		shorturl: idToURL(data.i, req),
		original: data.f,
		created: new Date(data.d)
	};
}

function idToURL(id, req) {
	return (req ? "http://" + (req.get("host") || "") : "") + "/" + id;
}
