// Need this rather than .babelrc to run on d3 inside node_modules (see also rollup-plugin-babel config)

module.exports = api => {
	// Make sure config gets updated when process.env.LEGACY changes
	api.cache.invalidate(() => !!process.env.LEGACY);

	const plugins = [
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
		presets: ["@babel/preset-react", "@babel/preset-typescript"],
		plugins,
		env: {
			test: {
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		},
	};
};
