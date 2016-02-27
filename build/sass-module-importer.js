var resolve = require("resolve");
var path = require("path");

module.exports = function(file, prev, done) {
	if (file[0] !== "~") return done({ file: file });

	resolve(file.substr(1), {
		basedir: path.dirname(prev),
		extensions: [ ".scss" ],
		packageFilter: function(pkg) {
			if (pkg.sass) {
				pkg.oldMain = pkg.main;
				pkg.main = pkg.sass;
			} else if (pkg.scss) {
				pkg.oldMain = pkg.main;
				pkg.main = pkg.scss;
			} else if (pkg.style) {
				pkg.oldMain = pkg.main;
				pkg.main = pkg.style;
			}

			return pkg;
		}
	}, function(err, res) {
		if (err) return done(err);
		done({ file: res });
	});
};
