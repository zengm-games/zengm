/* eslint-env node */

// Need this rather than .babelrc to run on d3 inside node_modules (see also rollup-plugin-babel config)

module.exports = {
	presets: ["@babel/preset-react", "@babel/preset-flow"],
	plugins: [
		"@babel/plugin-transform-runtime",
		"@babel/plugin-transform-for-of",
		"@babel/plugin-transform-parameters",
		"@babel/plugin-transform-destructuring",
		"@babel/plugin-transform-exponentiation-operator",
		"@babel/plugin-transform-async-to-generator",
		"@babel/plugin-proposal-object-rest-spread",
	],
	env: {
		test: {
			plugins: ["@babel/plugin-transform-modules-commonjs"],
		},
	},
};
