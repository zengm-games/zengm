// @flow

const build = require("./buildFuncs");

console.log("Generating sw.js...");

build.buildSW().then(() => {
    build.minifyJS("sw.js");
});
