/* eslint-env node */

const build = require("./tools/buildFuncs");

const sport = build.getSport();

const files = [
    "src/deion/test/mocha.js",
    `src/${sport}/worker/index.js`, // For overrides
    "src/deion/test/smoke.js",
];

module.exports = function(config) {
    config.set({
        frameworks: ["mocha", "browserify", "source-map-support"],

        files,

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
            transform: [
                "babelify",
                ["envify", { SPORT: sport }],
                [
                    "aliasify",
                    {
                        aliases: {
                            "league-schema.json": `./public/football/files/league-schema.json`,
                        },
                    },
                ],
            ],
        },

        browserNoActivityTimeout: 15 * 60 * 1000, // 15 minutes
        browserDisconnectTimeout: 15 * 60 * 1000, // 15 minutes

        browsers: ["ChromeHeadless", "FirefoxHeadless"],
    });
};
