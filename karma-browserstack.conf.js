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
const browserStack = require("../../.browserstack.json");
const build = require("./tools/buildFuncs");

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
        browser_version: "11.1", // Works back to 10 currently
        os: "OS X",
        os_version: "High Sierra",
    },
].reduce((acc, browser, i) => {
    acc[i] = browser;
    return acc;
}, {});

const sport = build.getSport();

const files = ["src/deion/test/mocha.js", "src/deion/test/smoke.js"];

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

        browserNoActivityTimeout: 5 * 60 * 1000, // 5 minutes
        browserDisconnectTimeout: 5 * 60 * 1000, // 5 minutes

        browserStack,

        customLaunchers,

        browsers: Object.keys(customLaunchers),
    });
};
