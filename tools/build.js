// @flow

const build = require("./buildFuncs");

console.log("Starting build.js...");

build.reset();
build.copyFiles();
build.minifyCss();

console.log("DONE! (except for JS)");
