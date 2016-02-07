var Temple = require("templejs");

var urlCount = new Temple.Variable(0);

// get the initial count of urls
App.phone.call("urlCount").then(function(count) {
	count = parseInt(count, 10);
	if (isNaN(count)) count = 0;
	urlCount.set(count);
}).catch(App.error.bind(App)).then(App.wait());

// listen for changes to number of urls
App.socket.on("url count", function(count) {
	urlCount.set(count);
});

// render the site when app is ready
App.ready(function() {
	Temple.paint("body", document.body, {
		title: App.get("site.title") || location.host || App.get("name"),
		version: App.get("version"),
		urlCount: urlCount
	});
});
