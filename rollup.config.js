import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import Temple from "templejs";
import path from "path";
import {forEach,has} from "lodash";
import builtins from "browserify/lib/builtins.js";

const emptyModule = require.resolve("browserify/lib/_empty.js");
const rollupEmptyModule = require.resolve("rollup-plugin-node-resolve/src/empty.js");
forEach(builtins, function(p, id) {
	if (p === emptyModule) builtins[id] = rollupEmptyModule;
});

const plugins = [];

if (process.env.TARGET === "browser") {
	plugins.push({
		resolveId: function(id) {
			if (has(builtins, id)) return builtins[id];
		},
		transform: function(source, id) {
			if (path.extname(id) !== ".html") return;

			return Temple.compile(source, {
				format: "es6"
			});
		}
	},

	nodeResolve({
		jsnext: false,
		main: true,
		browser: true
	}),

	commonjs({
		exclude: [ "src/**" ]
	}));
}

plugins.push(babel({
	exclude: "node_modules/**"
}));

export default {
	onwarn: ()=>{},
	plugins: plugins
};
