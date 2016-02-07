var fs = require("fs-promise");

var domain_regex = /[^a-z0-9\-\.\*]/i;

fs.readFile("blacklist.txt", {
	encoding: "utf-8"
}).catch(function(e) {
	if (e.code !== "ENOENT" && e.code !== "ENOTDIR") throw e;
	return "";
}).then(function(src) {
	App.blacklist = src.split(/\r?\n/g).map(function(d) {
		d = d.trim();
		if (domain_regex.test(d)) return null;
		d = d.toLowerCase().replace(/\./g, "\\.").replace(/\*/g, "(.*)");
		return new RegExp("^" + d + "$", "i");
	}).filter(Boolean);
}).catch(App.error.bind(App)).then(App.wait());
