import babel from "rollup-plugin-babel";
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import Temple from "templejs";
import path from "path";
import {forEach,includes,has} from "lodash";
import builtins from "browserify/lib/builtins.js";

const plugins = [];

const emptyModule = require.resolve("browserify/lib/_empty.js");
const rollupEmptyModule = require.resolve("rollup-plugin-node-resolve/src/empty.js");

forEach(builtins, function(p, id) {
	if (p === emptyModule) builtins[id] = rollupEmptyModule;
});

const emptyModules = [ "fs-promise" ];
const resolve = nodeResolve({
	jsnext: false,
	main: true,
	browser: true
});

if (process.env.TARGET === "browser") {
	plugins.push({
		resolveId: function(id, p) {
			if (includes(emptyModules, id)) return id;
			if (has(builtins, id)) return builtins[id];
			return resolve.resolveId(id, p);
		},
		load: function(id) {
			if (includes(emptyModules, id)) return "export default {};";
		}
	},

	{
		transform: function(source, id) {
			if (path.extname(id) !== ".html") return;

			return Temple.compile(source, {
				format: "es6"
			});
		}
	},

	commonjs({
		exclude: [ "src/**" ]
	}));
}

plugins.push(babel({
	exclude: 'node_modules/**'
}));

export default {
	onwarn: ()=>{},
	plugins: plugins
};
