// @flow

const rollup = require("rollup");
const build = require("./buildFuncs");
const rollupConfig = require("./rollupConfig");

console.log("Bundling JavaScript files...");

const sport = build.getSport();

(async () => {
    for (const name of ["ui", "worker"]) {
        const bundle = await rollup.rollup({
            ...rollupConfig,
            input: `src/${sport}/${name}/index.js`,
        });

        await bundle.write({
            name,
            file: `build/gen/${name}.js`,
            format: "iife",
        });
    }
})();
