// @flow

const fs = require("fs");
const build = require("./buildFuncs");

build.reset();
build.copyFiles();

// Remove service worker, so I don't have to deal with it being wonky in dev
fs.unlinkSync("build/sw.js");

build.setTimestamps(true);
