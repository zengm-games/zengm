/* eslint-env node */

const browserStack = require("../../.browserstack.json");

const customLaunchers = [
    {
        base: "BrowserStack",
        browser: "firefox",
        browser_version: "61.0", // Works back to 47 currently (52 is an LTS and the last release on XP)
        os: "Windows",
        os_version: "10",
    },
    {
        base: "BrowserStack",
        browser: "chrome",
        browser_version: "68.0", // Works back to 49 currently (last release on XP and some old Mac versions)
        os: "Windows",
        os_version: "10",
    },
    {
        base: "BrowserStack",
        browser: "safari",
        browser_version: "11.0", // Works back to 10 currently
        os: "OS X",
        os_version: "Sierra",
    },
].reduce((acc, browser, i) => {
    acc[i] = browser;
    return acc;
}, {});

module.exports = function(config) {
    config.set({
        frameworks: ["mocha", "browserify", "source-map-support"],

        files: [
            "src/js/test/index.js",
            "src/js/**/*.test.js",
            "src/js/test/**/*.js",
        ],

        preprocessors: {
            "src/js/**/*.js": ["browserify"],
        },

        autoWatch: false,

        singleRun: true,

        browserify: {
            debug: true,
            transform: ["babelify"],
        },

        browserNoActivityTimeout: 5 * 60 * 1000, // 5 minutes

        browserStack,

        customLaunchers,

        browsers: Object.keys(customLaunchers),
    });
};
