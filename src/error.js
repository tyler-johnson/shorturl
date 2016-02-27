export default function(e, req, res, next) {
	if (!e) return next();

	var code = e.status || (e.cause && e.cause.status);

	if (typeof code === "number" && !isNaN(code) && code > 0) {
		if (e.message) {
			res.status(code);
			res.type("txt");
			res.end(e.message);
		} else {
			res.sendStatus(code);
		}

		return;
	}

	console.log(e.stack || e.toString());
	res.sendStatus(500);
}
