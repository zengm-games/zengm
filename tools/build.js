var Promise = require("bluebird");
var execAsync = Promise.promisify(require("child_process").exec);
var fs = require("fs");
var CleanCSS = require('clean-css');
var moment = require("moment");
var replace = require("replace");

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
    var rev = d.format("YYYY-MM-DD") + "." + mins;

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

execAsync("rm -f gen/*").then(function () {
    console.log("Minifying JS...");
    return execAsync("node_modules/.bin/r.js -o baseUrl=js paths.requireLib=lib/require optimize=uglify2 preserveLicenseComments=false generateSourceMaps=true name=app include=requireLib mainConfigFile=js/app.js out=gen/app.js");
}).then(function () {
    minifyCss();
    setTimestamps();

    if (process.argv.length > 2 && process.argv[2] === "cordova") {
        console.log("Copying and processing files for Cordova...");

        return Promise.all([
            execAsync("cp index.html cordova/index.html"),
            execAsync("cp fonts/* cordova/fonts"),
            execAsync("head -n -1 gen/app.js > cordova/gen/app.js"), // Copy while removing source maps comment
            execAsync("cp gen/bbgm.css cordova/gen/bbgm.css")
        ]);
    }
}).then(function () {
    console.log("DONE!");
});
