/* eslint-env node */

const babel = require("rollup-plugin-babel");
const commonjs = require("rollup-plugin-commonjs");
const json = require("rollup-plugin-json");
const builtins = require("rollup-plugin-node-builtins");
const globals = require("rollup-plugin-node-globals");
const resolve = require("rollup-plugin-node-resolve");
const replace = require("rollup-plugin-replace");

module.exports = function(config) {
    config.set({
        frameworks: ["mocha", "source-map-support"],

        files: [
            "src/js/test/index.js",
            "src/js/common/helpers.test.js",
            //            "src/js/**/*.test.js",
            //            "src/js/test/**/*.js",
        ],

        preprocessors: {
            "src/js/**/*.js": ["rollup"],
        },

        rollupPreprocessor: {
            plugins: [
                replace({
                    "process.env.NODE_ENV": JSON.stringify("test"),
                }),
                babel({
                    exclude: "node_modules/**",
                }),
                json({
                    compact: true,
                    namedExports: false,
                }),
                commonjs({
                    namedExports: {
                        "node_modules/mocha/index.js": [
                            "after",
                            "before",
                            "describe",
                            "it",
                        ],
                        /*"node_modules/react/index.js": [
                            "Children",
                            "Component",
                            "PureComponent",
                            "PropTypes",
                            "createElement",
                            "Fragment",
                            "cloneElement",
                            "StrictMode",
                            "createFactory",
                            "createRef",
                            "createContext",
                            "isValidElement",
                            "isValidElementType",
                        ],
                        "node_modules/react-dom/index.js": [
                            "render",
                            "hydrate",
                        ],*/
                    },
                }),
                resolve(),
                builtins(),
                globals({
                    dirname: false,
                }),
            ],
            output: {
                format: "iife",
                name: "bbgm",
                sourcemap: "inline",
            },
        },

        // http://stackoverflow.com/a/42379383/786644
        browserConsoleLogOptions: {
            terminal: true,
            level: "",
        },

        autoWatch: false,

        singleRun: true,

        browserNoActivityTimeout: 5 * 60 * 1000, // 5 minutes

        reporters: ["mocha"],

        browsers: ["ChromeHeadless", "FirefoxHeadless"],
    });
};
