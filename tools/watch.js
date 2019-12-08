const fs = require("fs");
const importJsx = require("import-jsx");
const build = require("./lib/buildFuncs");

build.reset();
build.copyFiles();

// Remove service worker, so I don't have to deal with it being wonky in dev
fs.unlinkSync("build/sw.js");

const rev = build.genRev();
build.setTimestamps(rev, true);

const renderWatchProgress = importJsx("./lib/renderWatchProgress");
renderWatchProgress();
