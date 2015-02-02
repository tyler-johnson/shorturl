var _ = require("underscore"),
	Promise = require("bluebird");

global.$ = global.jQuery = require("jquery");
require("./bootstrap.js");

$(document).ready(function() {
	var form = $("#shortform");

	form.submit(function(e) {
		e.preventDefault();

		Promise.cast($.ajax({
			url: "/",
			data: form.serializeArray()
		})).then(function(res) {
			var shorturl = location.origin;
			if (shorturl[shorturl.length - 1] !== "/") shorturl += "/";
			shorturl += res.id;

			$("#result").html("<i class=\"text-success\">Shortified!</i><br/><b><a href=\"" + shorturl + "\">" + shorturl + "</a></b> &rarr; <a href=\"" + res.original + "\">" + res.original + "</a><br/><small class=\"text-muted\">(Hint: right-click the link to copy it)</small>");

			form[0].reset();
		});
	});
});