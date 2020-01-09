const alias = require("@rollup/plugin-alias");
const getSport = require("./getSport");
const rollupConfig = require("./rollupConfig");

const files = ["src/deion/test/mocha.js", "src/deion/test/smoke.ts"];

const sport = getSport();

const rollupConfigTemp = rollupConfig("test");
rollupConfigTemp.plugins.unshift(
	alias({
		entries: {
			"smoke-test-overrides": `./../../${sport}/worker/index.ts`,
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
		"src/**/*.{js,ts}": ["rollup"],
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
