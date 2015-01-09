var requirejs = require("requirejs");
var fs = require("fs");
var CleanCSS = require('clean-css');
var moment = require("moment");
var replace = require("replace");
var fse = require('fs-extra');

function removeOldFiles() {
    fse.removeSync("gen");
    fs.mkdirSync("gen");
}

function minifyJs(cb) {
    console.log("Minifying JS...");

    requirejs.optimize({
        baseUrl: "js",
        optimize: "uglify2",
        preserveLicenseComments: false,
        generateSourceMaps: true,
        name: "app",
        include: "lib/require",
        mainConfigFile: "js/app.js",
        out: "gen/app.js"
    }, cb);
}

function minifyCss() {
    console.log("Minifying CSS...");

    var source = fs.readFileSync("css/bootstrap.css") +
                 fs.readFileSync("css/bbgm.css") +
                 fs.readFileSync("css/bbgm-notifications.css") +
                 fs.readFileSync("css/DT_bootstrap.css");
    fs.writeFileSync("gen/bbgm.css", (new CleanCSS()).minify(source));
}

function setTimestamps() {
    console.log("Setting timestamps...");

    var d = moment();
    var mins = d.minutes() + 60 * d.hours();
    var rev = d.format("YYYY.MM.DD") + "." + mins;

    replace({
        regex: "LAST UPDATED:.*",
        replacement: "LAST UPDATED: " + d.toString(),
        paths: ["bbgm.appcache"],
        silent: true
    });
    replace({
        regex: "<!--rev-->.*</p>",
        replacement: "<!--rev-->" + rev + "</p>",
        paths: ["index.html"],
        silent: true
    });
    replace({
        regex: 'Bugsnag\\.appVersion = ".*"',
        replacement: 'Bugsnag.appVersion = "' + rev + '"',
        paths: ["index.html"],
        silent: true
    });
}

function copyCordova() {
    console.log("Copying and processing files for Cordova...");

    // Delete and recreate cordova folder
    fse.removeSync("cordova");
    fs.mkdirSync("cordova");

    // Copy over files
    fse.copySync("index.html", "cordova/index.html");
    fse.copySync("fonts", "cordova/fonts");
    fse.copySync("gen/bbgm.css", "cordova/gen/bbgm.css");

    // Delete source maps comment from app.js (last line) while copying
    var appJs = fs.readFileSync("gen/app.js", "utf8");
    appJs = appJs.substr(0, appJs.lastIndexOf("sourceMappingURL"));
    fs.writeFileSync("cordova/gen/app.js", appJs);
}



removeOldFiles();

minifyJs(function () {
    minifyCss();
    setTimestamps();

    if (process.argv.length > 2 && process.argv[2] === "cordova") {
        copyCordova();
    }

    console.log("DONE!");
});
