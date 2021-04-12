// Need this rather than .babelrc to run on d3 inside node_modules (see also rollup-plugin-babel config)

module.exports = api => {
	// Make sure config gets updated when process.env.LEGACY changes
	api.cache.invalidate(() =>
		JSON.stringify([process.env.LEGACY, process.env.NODE_ENV]),
	);

	const plugins = [
		require("./tools/babel-plugin-sport-functions"),
		[
			"@babel/plugin-proposal-optional-chaining",
			{
				loose: true,
			},
		], // Chrome 80, Firefox 74, Safari 13.1
		[
			"@babel/plugin-proposal-nullish-coalescing-operator",
			{
				loose: true,
			},
		], // Chrome 80, Firefox 72, Safari 13.1
	];

	// For module/nomodule switch, cutoffs are Chrome 60, Firefox 54, and Safari 10.1 https://philipwalton.com/articles/deploying-es2015-code-in-production-today/ so technically this is broken for Firefox 55 and Safari 11. For Safari 10.1, a bug https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc results in both bundles being loaded, and the legacy one takes precedence. Maybe that helps in Firefox 55, which seems to work.
	if (process.env.LEGACY) {
		plugins.push(
			"@babel/plugin-proposal-object-rest-spread", // Chrome 60, Firefox 55, Safari 11.1
			"@babel/plugin-transform-for-of", // Chrome 51, Firefox 53
			"@babel/plugin-transform-parameters", // Firefox 53
			"@babel/plugin-transform-destructuring", // Chrome 51, Firefox 53
			"@babel/plugin-transform-exponentiation-operator", // Chrome 52, Firefox 52, Safari 10.1
			"@babel/plugin-transform-async-to-generator", // Chrome 55, Firefox 52, Safari 11
		);
	}

	return {
		presets: [
			[
				"@babel/preset-react",
				{
					runtime: "automatic",

					// Results in a ton of warnings from Rollup during watch
					// development: process.env.NODE_ENV !== "production",
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
