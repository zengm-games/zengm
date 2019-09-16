/* eslint-env node */
module.exports = {
    setupFilesAfterEnv: [
        "./src/deion/test/jest.js",
        "./src/basketball/worker/index.js",
    ],
};
