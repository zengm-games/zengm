/* eslint-env node */

const React = require("react");
const ReactDOM = require("react-dom");
const alias = require("rollup-plugin-alias");
const babel = require("rollup-plugin-babel");
const commonjs = require("rollup-plugin-commonjs");
const globals = require("rollup-plugin-node-globals");
const json = require("rollup-plugin-json");
const builtins = require("rollup-plugin-node-builtins");
const resolve = require("rollup-plugin-node-resolve");
const replace = require("rollup-plugin-replace");
const build = require("./tools/buildFuncs");

const sport = build.getSport();

const files = [
    "src/deion/test/index.js",
    `src/${sport}/worker/index.js`, // For overrides
    //    `src/${sport}/**/*.test.js`,
    //    "src/deion/test/**/*.js",
];

if (sport === "basketball") {
    // Some deion tests assume basketball
    files.push("src/deion/**/*.test.js");
}

module.exports = function(config) {
    config.set({
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
            plugins: [
                alias({
                    entries: [
                        {
                            find: "league-schema",
                            replacement: `./../../../${sport}/ui/util/leagueSchema.js`,
                        },
                        // This is so Karma doesn't crash when using the big names file.
                        {
                            find: "player-names",
                            replacement:
                                process.env.NODE_ENV === "test"
                                    ? "./util/namesTest.js"
                                    : "./util/names.js",
                        },
                    ],
                }),
                replace({
                    "process.env.NODE_ENV": JSON.stringify("production"),
                    "process.env.SPORT": JSON.stringify(sport),
                }),
                babel({
                    exclude: "node_modules/!(d3)**",
                    runtimeHelpers: true,
                }),
                json({
                    compact: true,
                    namedExports: false,
                }),
                commonjs({
                    namedExports: {
                        react: Object.keys(React),
                        "react-dom": Object.keys(ReactDOM),
                    },
                }),
                resolve({
                    preferBuiltins: true,
                }),
                globals(),
                builtins(),
            ],
            output: {
                format: "iife",
                name: "bbgm",
                sourcemap: "inline",
            },
        },

        browserNoActivityTimeout: 15 * 60 * 1000, // 15 minutes
        browserDisconnectTimeout: 15 * 60 * 1000, // 15 minutes

        reporters: ["mocha"],

        browsers: ["ChromeHeadless", "FirefoxHeadless"],
    });
};
