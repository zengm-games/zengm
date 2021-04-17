const importJsx = require("import-jsx");
const build = require("./lib/buildFuncs");

build.reset();
build.copyFiles(true);

const rev = build.genRev();
build.setTimestamps(rev, true);
build.minifyIndexHTML();

const renderWatchProgress = importJsx("./lib/renderWatchProgress");
renderWatchProgress();
