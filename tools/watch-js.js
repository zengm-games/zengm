// @flow

const aliasify = require("aliasify");
const babelify = require("babelify");
const browserify = require("browserify");
const envify = require("envify/custom");
const fs = require("fs");
const watchify = require("watchify");

console.log("Watching JavaScript files...");

let sport = process.env.SPORT;
if (typeof sport !== "string") {
    sport = "basketball";
}

for (const name of ["ui", "worker"]) {
    // Mostly copied from cmd.js in watchify

    const b = browserify(`src/${sport}/${name}/index.js`, {
        debug: true,
        cache: {},
        packageCache: {},
    })
        .transform(babelify)
        .transform(envify({ NODE_ENV: "development", SPORT: sport }), {
            global: true,
        })
        .transform(aliasify, {
            aliases: {
                "league-schema.json": `./public/${sport}/files/league-schema.json`,
            },
        })
        .plugin(watchify);

    let bytes = 0;
    let time = 0;
    b.on("bytes", bytesLocal => {
        bytes = bytesLocal;
    });
    b.on("time", timeLocal => {
        time = timeLocal;
    });

    const outFilename = `build/gen/${name}.js`;

    const bundle = () => {
        let didError = false;

        const writeStream = fs.createWriteStream(outFilename);
        writeStream.on("error", err => {
            console.error(err);
        });

        b.bundle()
            .on("error", err => {
                console.error(String(err));
                if (!didError) {
                    didError = true;
                    writeStream.end(
                        `console.error(${JSON.stringify(String(err))});`,
                    );
                }
            })
            .pipe(writeStream);

        writeStream.on("finish", async () => {
            if (!didError) {
                console.log(
                    `${(bytes / 1024 / 1024).toFixed(
                        2,
                    )} MB written to ${outFilename} (${(time / 1000).toFixed(
                        2,
                    )} seconds) at ${new Date().toLocaleTimeString()}`,
                );
            }
        });
    };

    b.on("update", bundle);
    bundle();
}
