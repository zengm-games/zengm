const fs = require("fs");
const CleanCSS = require('clean-css');
const replace = require("replace");
const fse = require('fs-extra');

const reset = () => {
    console.log('Resetting "build" directory...');

    fse.removeSync('build');
    fs.mkdirSync('build');
    fs.mkdirSync('build/gen');
};

const copyFiles = () => {
    console.log('Copying files from "src" directory to "build" directory...');

    fse.copySync('src', 'build', {
        filter: filename => {
            if (filename.indexOf('src/js') === 0) {
                return false;
            }
            if (filename.indexOf('src/templates') === 0) {
                return false;
            }
            return true;
        },
    });

    // Filter function still makes empty folders
    fse.removeSync('build/js');
    fse.removeSync('build/templates');
};

const minifyCss = () => {
    console.log("Minifying CSS...");

    const source = fs.readFileSync("src/css/bootstrap.css") +
                 fs.readFileSync("src/css/bbgm.css") +
                 fs.readFileSync("src/css/bbgm-notifications.css") +
                 fs.readFileSync("src/css/DT_bootstrap.css");
    const result = (new CleanCSS()).minify(source);
    if (result.errors.length > 0) {
        console.log('clean-css errors', result.errors);
    }
    if (result.warnings.length > 0) {
        console.log('clean-css warnings', result.warnings);
    }
    fs.writeFileSync("build/gen/bbgm.css", result.styles);
};

const setTimestamps = () => {
    console.log("Setting timestamps...");

    const d = new Date();
    const date = d.toISOString().split('T')[0].replace(/-/g, '.');
    const rev = `${date}.${d.getMinutes() + 60 * d.getHours()}`;
    console.log(`rev ${rev}`);

    replace({
        regex: "TIMESTAMP_GOES_HERE",
        replacement: d.toString(),
        paths: ["build/bbgm.appcache"],
        silent: true,
    });
    replace({
        regex: "REV_GOES_HERE",
        replacement: rev,
        paths: ["build/index.html"],
        silent: true,
    });
};

reset();
copyFiles();
minifyCss();
setTimestamps();

console.log("DONE! (except for JS)");
