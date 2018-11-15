// @flow

const workboxBuild = require("workbox-build");
const CleanCSS = require("clean-css");
const fs = require("fs");
const fse = require("fs-extra");
const sass = require("node-sass");
const path = require("path");
const replace = require("replace");
const Terser = require("terser");

const buildCSS = (watch /*: boolean*/ = false) => {
    try {
        const filenames = ["light", "dark"];
        for (const filename of filenames) {
            const start = process.hrtime();

            // If more Sass files are needed, then create them and @import them into this main Sass file.
            const sassFilePath = `public/css/${filename}.scss`;
            const sassResult = sass.renderSync({
                file: sassFilePath,
            });
            const source = sassResult.css.toString();

            const outFilename = `build/gen/${filename}.css`;

            let output;
            if (!watch) {
                const result = new CleanCSS().minify(source);
                if (result.errors.length > 0) {
                    console.log("clean-css errors", result.errors);
                }
                if (result.warnings.length > 0) {
                    console.log("clean-css warnings", result.warnings);
                }
                output = result.styles;
            } else {
                output = source;
            }

            fs.writeFileSync(outFilename, output);

            const bytes = Buffer.byteLength(output, "utf8");

            const diff = process.hrtime(start);
            const NS_PER_SECOND = 10 ** 9;
            const timeInS = diff[0] + diff[1] / NS_PER_SECOND;

            console.log(
                `${(bytes / 1024 / 1024).toFixed(
                    2,
                )} MB written to ${outFilename} (${timeInS.toFixed(
                    2,
                )} seconds) at ${new Date().toLocaleTimeString()}`,
            );
        }
    } catch (err) {
        if (watch) {
            console.error("Error building CSS:", err);
        } else {
            throw err;
        }
    }
};

// NOTE: This should be run *AFTER* all assets are built
const buildSW = async () => {
    const { count, size, warnings } = await workboxBuild.injectManifest({
        swSrc: "public/sw.js",
        swDest: "build/sw.js",
        globDirectory: "build",
        globPatterns: [
            "**/*.{js,css,html}",
            "fonts/*.woff2",
            "img/logos/*.png",
        ],
        dontCacheBustUrlsMatching: new RegExp("gen/(ui|worker)-.*.js"),

        // Changing default is only needed for unminified versions from watch-js
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
    });

    warnings.forEach(console.warn);
    console.log(`${count} files will be precached, totaling ${size} bytes.`);
};

const copyFiles = () => {
    console.log(
        'Copying files from "public" directory to "build" directory...',
    );
    const foldersToIgnore = ["css"];

    fse.copySync("public", "build", {
        filter: filename => {
            // Loop through folders to ignore.
            for (const folder of foldersToIgnore) {
                if (filename.startsWith(`public/${folder}`)) {
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

const minifyJS = (name /*: string */) => {
    const data = fs.readFileSync(`build/${name}`, "utf8");

    const result = Terser.minify(data, {
        // Needed until https://bugs.webkit.org/show_bug.cgi?id=171041 is fixed
        safari10: true,
        sourceMap: {
            content: "inline",
            filename: `build/${name}`,
            url: `${path.basename(name)}.map`,
        },
    });

    fs.writeFileSync(`build/${name}`, result.code);
    fs.writeFileSync(`build/${name}.map`, result.map);
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
    buildCSS,
    buildSW,
    copyFiles,
    genRev,
    minifyJS,
    reset,
    setTimestamps,
};
