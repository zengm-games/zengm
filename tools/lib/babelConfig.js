// Need babel.config.js this rather than .babelrc to run on d3 inside node_modules (see also @rollup/plugin-babel config)

const babelPluginSportFunctions = require("../babel-plugin-sport-functions");

module.exports = legacy => {
	const plugins = [babelPluginSportFunctions];

	if (legacy) {
		plugins.push(
			[
				"@babel/plugin-proposal-optional-chaining",
				{
					loose: true,
				},
			], // Chrome 80, Safari 13.1
			[
				"@babel/plugin-proposal-nullish-coalescing-operator",
				{
					loose: true,
				},
			], // Chrome 80, Safari 13.1
			"@babel/plugin-proposal-object-rest-spread", // Chrome 60, Safari 11.1
			"@babel/plugin-transform-for-of", // Chrome 51
			"@babel/plugin-transform-destructuring", // Chrome 51
			"@babel/plugin-transform-exponentiation-operator", // Chrome 52
			"@babel/plugin-transform-async-to-generator", // Chrome 55
		);
	}

	return {
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
		env: {
			test: {
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		},
	};
};
