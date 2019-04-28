// @flow

const chokidar = require("chokidar");
const build = require("./buildFuncs");

console.log("Watching CSS files...");

const watcher = chokidar.watch("public/css", {});

const buildCSS = () => {
    build.buildCSS(true);
};

buildCSS();

watcher.on("change", () => {
    buildCSS();
});
