const rollupConfig = require("./rollupConfig");

const files = ["src/deion/test/mocha.js", "src/deion/test/smoke.js"];

module.exports = {
    frameworks: ["mocha", "source-map-support"],

    files: files.map(pattern => {
        return {
            pattern,
            watched: false,
        };
    }),

    preprocessors: {
        "src/**/*.js": ["rollup"],
    },

    // http://stackoverflow.com/a/42379383/786644
    browserConsoleLogOptions: {
        terminal: true,
        level: "",
    },

    autoWatch: false,

    singleRun: true,

    rollupPreprocessor: {
        ...rollupConfig("test"),
        output: {
            format: "iife",
            name: "bbgm",
            sourcemap: true,
        },
    },

    browserNoActivityTimeout: 15 * 60 * 1000, // 15 minutes
    browserDisconnectTimeout: 15 * 60 * 1000, // 15 minutes

    browsers: ["ChromeHeadless", "FirefoxHeadless"],
};
