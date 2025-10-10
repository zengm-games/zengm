import browserstackLauncher from "karma-browserstack-launcher";
import chromeLauncher from "karma-chrome-launcher";
import firefoxLauncher from "karma-firefox-launcher";
import mocha from "karma-mocha";
import rolldownPreprocessor from "./karmaRolldownPreprocessor.ts";
// @ts-expect-error
import sourceMapSupport from "karma-source-map-support";
import { rolldownConfig } from "./rolldownConfig.ts";

const files = ["src/test/mocha.ts", "src/test/smoke.ts"];

export default {
	plugins: [
		browserstackLauncher,
		chromeLauncher,
		firefoxLauncher,
		mocha,
		rolldownPreprocessor,
		sourceMapSupport,
	],

	frameworks: ["mocha", "source-map-support"],

	files: files.map((pattern) => {
		return {
			pattern,
			watched: false,
		};
	}),

	preprocessors: {
		"src/**/*.{js,jsx,ts,tsx}": ["rolldown"],
	},

	autoWatch: false,

	singleRun: true,

	rolldownPreprocessor: {
		...rolldownConfig("ui", { nodeEnv: "test" }),
		output: {
			format: "iife",
			sourcemap: true,
		},
	},

	browserNoActivityTimeout: 15 * 60 * 1000, // 15 minutes
	browserDisconnectTimeout: 15 * 60 * 1000, // 15 minutes
};
