import alias from "@rollup/plugin-alias";
import rollupConfig from "./rollupConfig.js";

const files = ["src/test/mocha.ts", "src/test/smoke.ts"];

const rollupConfigTemp = rollupConfig("test");
rollupConfigTemp.plugins.unshift(
	alias({
		entries: {
			"smoke-test-overrides": `./../worker/index.ts`,
		},
	}),
);

export default {
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
