import babel from "rollup-plugin-babel";
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import Temple from "templejs";
import path from "path";

const plugins = [];

if (process.env.TARGET === "browser") {
	plugins.push({
		transform: function(source, id) {
			if (path.extname(id) !== ".html") return;

			return {
				code: `import Temple from "templejs";\n\n` + Temple.compile(source, {
					exports: "es6"
				}),
				map: { mappings: "" }
			};
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
	exclude: 'node_modules/**'
}));

export default {
	onwarn: ()=>{},
	plugins: plugins
};
