// @flow

const React = require("react");
const ReactDOM = require("react-dom");
const rollup = require("rollup");
const alias = require("rollup-plugin-alias");
const babel = require("rollup-plugin-babel");
const commonjs = require("rollup-plugin-commonjs");
const globals = require("rollup-plugin-node-globals");
const json = require("rollup-plugin-json");
const builtins = require("rollup-plugin-node-builtins");
const resolve = require("rollup-plugin-node-resolve");
const replace = require("rollup-plugin-replace");
const build = require("./buildFuncs");

console.log("Bundling JavaScript files...");

const BLACKLIST = {
    ui: [/.*\/worker.*/],
    worker: [/.*\/ui.*/, /.*react.*/],
};

const sport = build.getSport();

(async () => {
    for (const name of ["ui", "worker"]) {
        const bundle = await rollup.rollup({
            input: `src/${sport}/${name}/index.js`,
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
                resolve(),
                globals(),
                builtins(),
            ],
        });

        await bundle.write({
            name,
            file: `build/gen/${name}.js`,
            format: "iife",
        });
    }
})();
