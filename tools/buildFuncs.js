// @flow

const workboxBuild = require("workbox-build");
const CleanCSS = require("clean-css");
const fs = require("fs");
const fse = require("fs-extra");
const sass = require("node-sass");
const path = require("path");
const replace = require("replace");
const Terser = require("terser");

// NOTE: This should be run *AFTER* all assets are built
const buildSW = async () => {
    const { count, size, warnings } = await workboxBuild.injectManifest({
        swSrc: "src/sw.js",
        swDest: "build/sw.js",
        globDirectory: "build",
        globPatterns: ["**/*.{js,css,html}", "fonts/*.woff", "img/logos/*.png"],
        dontCacheBustUrlsMatching: new RegExp("gen/(ui|worker)-.*.js"),

        // Changing default is only needed for unminified versions from watch-js
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
    });

    warnings.forEach(console.warn);
    console.log(`${count} files will be precached, totaling ${size} bytes.`);
};

const copyFiles = () => {
    console.log('Copying files from "src" directory to "build" directory...');
    const foldersToIgnore = ["css", "js", "templates"];

    fse.copySync("src", "build", {
        filter: filename => {
            // Loop through folders to ignore.
            for (const folder of foldersToIgnore) {
                if (filename.indexOf(`src/${folder}`) === 0) {
                    return false;
                }
            }

            return true;
        },
    });

    // Remove the empty folders created by the "filter" function.
    for (const folder of foldersToIgnore) {
        fse.removeSync(`build/${folder}`);
    }
};

const genRev = () => {
    const d = new Date();
    const date = d
        .toISOString()
        .split("T")[0]
        .replace(/-/g, ".");
    const minutes = String(d.getUTCMinutes() + 60 * d.getUTCHours()).padStart(
        4,
        "0",
    );
    const rev = `${date}.${minutes}`;
    console.log(`rev ${rev}`);

    return rev;
};

const minifyCss = () => {
    console.log("Minifying CSS...");
    let source = "";

    /*
     * CSS files
     */

    const cssFilenames = [];

    // Read each CSS file into a string.
    for (const filename of cssFilenames) {
        source += fs.readFileSync(`src/css/${filename}`).toString();
    }

    /*
     * Sass files
     */

    // If more Sass files are needed, then create them and @import them into
    // this main Sass file.
    const sassFilePath = "src/css/bbgm.scss";
    const sassResult = sass.renderSync({
        file: sassFilePath,
    });
    source += sassResult.css.toString();

    /*
     * Use CleanCSS to minify CSS and Sass sources.
     */
    const result = new CleanCSS().minify(source);
    if (result.errors.length > 0) {
        console.log("clean-css errors", result.errors);
    }
    if (result.warnings.length > 0) {
        console.log("clean-css warnings", result.warnings);
    }
    fs.writeFileSync("build/gen/bbgm2.css", result.styles);
};

const minifyJS = (name /*: string */) => {
    console.log("minify", name);
    const data = fs.readFileSync(`build/${name}`, "utf8");

    const result = Terser.minify(data, {
        mangle: {
            // Needed until https://bugs.webkit.org/show_bug.cgi?id=171041 is fixed
            safari10: true,
        },
        sourceMap: {
            content: "inline",
            filename: `build/${name}`,
            url: `${path.basename(name)}.map`,
        },
    });

    fs.writeFileSync(`build/${name}`, result.code);
    fs.writeFileSync(`build/${name}.map`, result.map);
    console.log("done", name);
};

const reset = () => {
    console.log('Resetting "build" directory...');

    fse.removeSync("build");
    fs.mkdirSync("build");
    fs.mkdirSync("build/gen");
};

const setTimestamps = () => {
    console.log("Setting timestamps...");

    const rev = genRev();

    replace({
        regex: "REV_GOES_HERE",
        replacement: rev,
        paths: ["build/index.html", "build/gen/ui.js", "build/gen/worker.js"],
        silent: true,
    });

    fs.renameSync("build/gen/ui.js", `build/gen/ui-${rev}.js`);
    fs.renameSync("build/gen/worker.js", `build/gen/worker-${rev}.js`);

    return rev;
};

module.exports = {
    buildSW,
    copyFiles,
    genRev,
    minifyCss,
    minifyJS,
    reset,
    setTimestamps,
};
