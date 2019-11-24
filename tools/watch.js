// @flow

const fs = require("fs");
const build = require("./lib/buildFuncs");
const watchCSS = require("./lib/watchCSS");
const watchJS = require("./lib/watchJS");
const watchJSONSchema = require("./lib/watchJSONSchema");

build.reset();
build.copyFiles();

// Remove service worker, so I don't have to deal with it being wonky in dev
fs.unlinkSync("build/sw.js");

const rev = build.genRev();
build.setTimestamps(rev, true);

// This will complete its initial write before watchJS runs, which is good because then the schema
// file will be available to be included in the JS bundle.
watchJSONSchema();

watchJS();

// Since watchJS is async, this will run in parallel
watchCSS();
