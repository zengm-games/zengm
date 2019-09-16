// @flow

const rollup = require("rollup");
const build = require("./buildFuncs");
const rollupConfig = require("./rollupConfig");

console.log("Bundling JavaScript files...");

const rev = build.genRev();
const sport = build.getSport();

(async () => {
    await Promise.all(
        ["ui", "worker"].map(async name => {
            const bundle = await rollup.rollup({
                ...rollupConfig("production"),
                input: `src/${sport}/${name}/index.js`,
            });

            await bundle.write({
                name,
                file: `build/gen/${name}-${rev}.js`,
                format: "iife",
                sourcemap: true,
            });
        }),
    );

    build.setTimestamps(rev);
})();
