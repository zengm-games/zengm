// Need babel.config.js this rather than .babelrc to run on d3 inside node_modules (see also @rollup/plugin-babel config)

import { babelPluginSportFunctions } from "../babel-plugin-sport-functions/index.js";

export const babelConfig = (legacy) => {
	const plugins = [babelPluginSportFunctions];

	if (legacy) {
		plugins.push(
			// Used in nanoevents and maybe other dependencies
			"@babel/plugin-transform-logical-assignment-operators", // Chrome 85
		);
	}

	return {
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
		plugins,
	};
};
