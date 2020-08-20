module.exports = {
	moduleNameMapper: {
		"^player-names$": "<rootDir>/src/worker/data/names-test.json",
		"^bbgm-polyfills$": "<rootDir>/src/common/polyfills-noop.ts",

		// This is assumed to be generated prior to rollup being started
		"^league-schema$": "<rootDir>/build/files/league-schema.json",
	},
	setupFilesAfterEnv: ["./src/test/jest.ts", "./src/worker/index.ts"],
};
