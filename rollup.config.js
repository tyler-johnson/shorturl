import babel from "rollup-plugin-babel";
import Temple from "templejs";
import path from "path";

export default {
	onwarn: ()=>{},
	plugins: [
		{
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
		babel({
			exclude: 'node_modules/**'
		})
	]
};
