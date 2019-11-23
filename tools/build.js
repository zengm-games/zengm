// @flow

const fs = require("fs");
const build = require("./lib/buildFuncs");
const generateJSONSchema = require("./lib/generateJSONSchema");

console.log("Starting build.js...");

build.reset();
build.copyFiles();
build.buildCSS();

const jsonSchema = generateJSONSchema(build.getSport());
fs.writeFileSync(
	"build/files/league-schema.json",
	JSON.stringify(jsonSchema, null, 2),
);

console.log("DONE! (except for JS)");
