// @flow

const chokidar = require("chokidar");
const build = require("./buildFuncs");

console.log("Watching CSS files...");

// Create the watcher.
const watcher = chokidar.watch("src/css", {});

// Create the function to run.
function commands() {
    build.buildCSS(true);
}

// Run the commands once first.
commands();

watcher.on("change", () => {
    commands();
});
