module.exports = {
	moduleNameMapper: {
		"^bbgm-polyfills$": "<rootDir>/src/common/polyfills-noop.ts",
		"^bbgm-debug$": "<rootDir>/src/worker/core/debug/index.ts",

		// This is assumed to be generated prior to rollup being started
		"^league-schema$": "<rootDir>/build/files/league-schema.json",
	},

	setupFilesAfterEnv: ["./src/test/jest.ts", "./src/worker/index.ts"],

	// https://stackoverflow.com/a/43197503/786644
	transformIgnorePatterns: ["<rootDir>/node_modules/(?!lodash-es)"],

	// https://jestjs.io/blog/2021/05/25/jest-27
	testEnvironment: "jsdom",
};
