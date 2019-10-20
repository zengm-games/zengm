/* eslint-env node */
module.exports = {
	moduleNameMapper: {
		// Football cause schema is empty currently, should be faster
		"^league-schema$": "<rootDir>/public/football/files/league-schema.json",
		"^player-names$": "<rootDir>/src/deion/worker/data/names-test.json",
	},
	setupFilesAfterEnv: [
		"./src/deion/test/jest.js",
		"./src/basketball/worker/index.js",
	],
};
