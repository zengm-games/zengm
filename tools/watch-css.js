/*
 * Packages
 */
const chokidar = require('chokidar');

/*
 * Modules
 */
const build = require('./buildFuncs.js');

// Create the watcher.
const watcher = chokidar.watch('src/css', {})

watcher.on('change', path => {
  build.minifyCss();
});
