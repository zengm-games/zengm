/*
 * Packages
 */
const chokidar = require('chokidar');

/*
 * Modules
 */
const build = require('./buildFuncs.js');

// Create the watcher.
const watcher = chokidar.watch('src/css', {});

// Create the function to run.
function commands() {
    build.minifyCss();
}

// Run the commands once first.
commands();

watcher.on('change', () => {
    commands();
});
