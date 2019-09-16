/* eslint-env node */
const build = require("./tools/buildFuncs");

const sport = build.getSport();

module.exports = {
    setupFilesAfterEnv: [
        "./src/deion/test/jest.js",
        `./src/${sport}/worker/index.js`,
    ],
};
