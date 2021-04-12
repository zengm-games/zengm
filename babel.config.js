// Need this rather than .babelrc to run on d3 inside node_modules (see also rollup-plugin-babel config)

module.exports = api => {
	// Make sure config gets updated when process.env.LEGACY changes
	api.cache.invalidate(() =>
		JSON.stringify([process.env.LEGACY, process.env.NODE_ENV]),
	);

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
			[
				"@babel/preset-env",
				{
					bugfixes: true,
					loose: true,
					targets: process.env.LEGACY
						? {
								chrome: "49",
								firefox: "47",
								safari: "10",
						  }
						: {
								esmodules: true,
						  },
					exclude: ["@babel/plugin-transform-regenerator"],
				},
			],
		],
		plugins: [require("./tools/babel-plugin-sport-functions")],
		env: {
			test: {
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		},
	};
};
