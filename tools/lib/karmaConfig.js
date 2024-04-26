import alias from "@rollup/plugin-alias";
import rollupConfig from "./rollupConfig.js";
import browserstackLauncher from "karma-browserstack-launcher";
import chromeLauncher from "karma-chrome-launcher";
import firefoxLauncher from "karma-firefox-launcher";
import mocha from "karma-mocha";
import rollupPreprocessor from "karma-rollup-preprocessor";
import sourceMapSupport from "karma-source-map-support";

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
	plugins: [
		browserstackLauncher,
		chromeLauncher,
		firefoxLauncher,
		mocha,
		rollupPreprocessor,
		sourceMapSupport,
	],

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
