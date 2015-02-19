global.$ = global.jQuery = require("jquery");

$(document).ready(function() {
	var form = $("#shortform");

	form.submit(function(e) {
		e.preventDefault();

		$.ajax({
			method: "GET",
			url: "/",
			data: form.serializeArray()
		}).done(function(res) {
			var shorturl = location.origin;
			if (shorturl[shorturl.length - 1] !== "/") shorturl += "/";
			shorturl += res.id;

			$("#result").html("<i class=\"text-success\">Shortified!</i><br/><b><a href=\"" + shorturl + "\">" + shorturl + "</a></b> &rarr; <a href=\"" + res.original + "\">" + res.original + "</a><br/><small class=\"text-muted\">(Hint: right-click the link to copy it)</small>");

			form[0].reset();
		}).fail(function(xhr, status, err) {
			var message = "Something terrible happened and we couldn't shorten that link! Please try again.";
			if (xhr.status === 400) message = xhr.responseText;

			$("#result").html("<i class=\"text-danger\">Oh no!</i><br/>" + message);
		});
	});
});