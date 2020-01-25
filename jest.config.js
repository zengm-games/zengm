module.exports = {
	moduleNameMapper: {
		"^player-names$": "<rootDir>/src/deion/worker/data/names-test.json",

		// This is assumed to be generated prior to rollup being started
		"^league-schema$": "<rootDir>/build/files/league-schema.json",
	},
	setupFilesAfterEnv: [
		"./src/deion/test/jest.ts",
		"./src/basketball/worker/index.ts",
	],
};
