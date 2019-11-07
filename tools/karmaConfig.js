const alias = require("rollup-plugin-alias");
const build = require("./buildFuncs");
const rollupConfig = require("./rollupConfig");

const files = ["src/deion/test/mocha.js", "src/deion/test/smoke.js"];

const sport = build.getSport();

const rollupConfigTemp = rollupConfig("test");
rollupConfigTemp.plugins.unshift(
	alias({
		entries: {
			"smoke-test-overrides": `./../../${sport}/worker/index.js`,
		},
	}),
);

module.exports = {
	frameworks: ["mocha", "source-map-support"],

	files: files.map(pattern => {
		return {
			pattern,
			watched: false,
		};
	}),

	preprocessors: {
		"src/**/*.js": ["rollup"],
	},

	autoWatch: false,

	singleRun: true,

	rollupPreprocessor: {
		...rollupConfigTemp,
		output: {
			format: "iife",
			indent: false,
			name: "bbgm",
			sourcemap: true,
		},
	},

	browserNoActivityTimeout: 15 * 60 * 1000, // 15 minutes
	browserDisconnectTimeout: 15 * 60 * 1000, // 15 minutes

	browsers: ["ChromeHeadless", "FirefoxHeadless"],
};
