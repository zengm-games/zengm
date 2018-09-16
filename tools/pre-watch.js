// @flow

const replace = require("replace");
const build = require("./buildFuncs");

build.reset();
build.copyFiles();

const rev = build.genRev();
replace({
    regex: "REV_GOES_HERE",
    replacement: rev,
    paths: ["build/index.html"],
    silent: true,
});

replace({
    regex: '-" \\+ bbgmVersion \\+ "',
    replacement: "",
    paths: ["build/index.html"],
    silent: true,
});
