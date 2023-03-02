export default {
	moduleNameMapper: {
		"^bbgm-polyfills$": "<rootDir>/src/common/polyfills-modern.ts",
		"^bbgm-polyfills-ui$": "<rootDir>/src/common/polyfills-noop.ts",
		"^bbgm-debug$": "<rootDir>/src/worker/core/debug/index.ts",
		"^ajv-hack$": "<rootDir>/src/worker/ajvHack/index.ts",

		// This is assumed to be generated prior to rollup being started
		"^league-schema$": "<rootDir>/build/files/league-schema.json",
	},

	setupFilesAfterEnv: ["./src/test/jest.ts", "./src/worker/index.ts"],

	// https://stackoverflow.com/a/43197503/786644
	transformIgnorePatterns: [
		"<rootDir>/node_modules/(?!lodash-es|d3-|fake-indexeddb)",
	],

	// Non-default value is needed to catch .cjs test file
	testRegex: "\\.test\\.c?[jt]sx?$",

	// This is not needed for most tests, but getting rid of it somehow slows down src/worker/core/league/create.test.ts so might as well keep it
	testEnvironment: "jsdom",
};
