const build = require("./lib/buildFuncs");

console.log("Generating sw.js...");

build.buildSW().then(() => {
	build.minifyJS("sw.js");
});
