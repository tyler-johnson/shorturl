import babel from "rollup-plugin-babel";
import json from "rollup-plugin-json";
import jst from "rollup-plugin-jst";
import string from "rollup-plugin-string";

export default {
	onwarn: ()=>{},
	format: "cjs",
	plugins: [
		jst({
      include: 'src/**',
      templateOptions: {
        variable: '$'
      }
    }),
		string({
			include: 'src/*.txt'
		}),
		json(),
		babel({
			exclude: "node_modules/**"
		})
	]
};
