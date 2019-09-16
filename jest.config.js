/* eslint-env node */
module.exports = {
    moduleNameMapper: {
        // Football cause schema is empty currently, should be faster
        "^league-schema$": "<rootDir>/src/football/ui/util/leagueSchema.js",
        "^player-names$": "<rootDir>/src/basketball/worker/util/namesTest.js",
    },
    setupFilesAfterEnv: [
        "./src/deion/test/jest.js",
        "./src/basketball/worker/index.js",
    ],
};
