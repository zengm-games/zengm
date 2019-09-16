const rollup = require("rollup");
const build = require("./buildFuncs");
const rollupConfig = require("./rollupConfig");

console.log("Watching JavaScript files...");

const sport = build.getSport();

// Could pass an array to rollup.watch, but that seems to make it bundle in series rather than parallel
for (const name of ["ui", "worker"]) {
    const file = `build/gen/${name}.js`;

    const watcher = rollup.watch({
        ...rollupConfig("development"),
        input: `src/${sport}/${name}/index.js`,
        output: {
            name,
            file,
            format: "iife",
        },
    });

    let startTime;
    watcher.on("event", event => {
        if (event.code === "START") {
            startTime = new Date().getTime();
        } else if (event.code === "END") {
            const delta = new Date().getTime() - startTime;
            console.log(
                `Bundle written to ${file} (${(delta / 1000).toFixed(
                    2,
                )} seconds) at ${new Date().toLocaleTimeString()}`,
            );
        } else if (event.code === "ERROR" || event.code === "FATAL") {
            console.log(name, event);
        }
    });
}
