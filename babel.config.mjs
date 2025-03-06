import { babelPluginSportFunctions } from "./tools/babel-plugin-sport-functions/index.js";

export default {
	compact: false,
	presets: [
		[
			"@babel/preset-react",
			{
				runtime: "automatic",
			},
		],
		"@babel/preset-typescript",
	],
	plugins: [babelPluginSportFunctions],
};
