/* eslint-env node */

const karmaConfig = require("./tools/karmaConfig");

module.exports = function(config) {
    config.set({
        ...karmaConfig,
        autoWatch: false,
        singleRun: true,
        browsers: ["ChromeHeadless", "FirefoxHeadless"],
    });
};
