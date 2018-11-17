/* eslint-env node */

module.exports = function(config) {
    config.set({
        frameworks: ["mocha", "browserify", "source-map-support"],

        files: [
            "src/basketball/test/index.js",
            "src/**/*.test.js",
            "src/basketball/test/**/*.js",
        ],

        preprocessors: {
            "src/**/*.js": ["browserify"],
        },

        // http://stackoverflow.com/a/42379383/786644
        browserConsoleLogOptions: {
            terminal: true,
            level: "",
        },

        autoWatch: false,

        singleRun: true,

        browserify: {
            debug: true,
            transform: ["babelify"],
        },

        browserNoActivityTimeout: 5 * 60 * 1000, // 5 minutes
        browserDisconnectTimeout: 5 * 60 * 1000, // 5 minutes

        reporters: ["mocha"],

        browsers: ["ChromeHeadless", "FirefoxHeadless"],
    });
};
