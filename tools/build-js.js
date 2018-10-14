// @flow

// Used to be:
// browserify -d -p [minifyify --map app.js.map --output gen/app.js.map] js/app.js -o gen/app.js
// ...but then it got too complicated, and this seemed easier

const rollup = require("rollup");
const babel = require("rollup-plugin-babel");
const commonjs = require("rollup-plugin-commonjs");
const json = require("rollup-plugin-json");
const builtins = require("rollup-plugin-node-builtins");
const resolve = require("rollup-plugin-node-resolve");
const replace = require("rollup-plugin-replace");

const babelify = require("babelify");
const browserify = require("browserify");
const blacklistify = require("blacklistify/custom");
const envify = require("envify/custom");
const fs = require("fs");

console.log("Bundling JavaScript files...");

const BLACKLIST = {
    ui: [/.*\/worker.*/],
    worker: [/.*\/ui.*/, /.*react.*/],
};

(async () => {
    for (const name of ["ui", "worker"]) {
        const bundle = await rollup.rollup({
            input: `src/js/${name}/index.js`,
            plugins: [
                replace({
                    "process.env.NODE_ENV": JSON.stringify("production"),
                }),
                babel({
                    exclude: "node_modules/**",
                }),
                json({
                    compact: true,
                    namedExports: false,
                }),
                commonjs({
                    namedExports: {
                        "node_modules/react/index.js": [
                            "Children",
                            "Component",
                            "PureComponent",
                            "PropTypes",
                            "createElement",
                            "Fragment",
                            "cloneElement",
                            "StrictMode",
                            "createFactory",
                            "createRef",
                            "createContext",
                            "isValidElement",
                            "isValidElementType",
                        ],
                        "node_modules/react-dom/index.js": [
                            "render",
                            "hydrate",
                        ],
                    },
                }),
                resolve(),
                builtins(),
            ],
        });

        await bundle.write({
            name,
            file: `build/gen/${name}.js`,
            format: "iife",
        });

        /*        browserify(`src/js/${name}/index.js`, { debug: true })
            .on("error", console.error)
            .transform(babelify)
            .transform(blacklistify(BLACKLIST[name]))
            .transform(envify({ NODE_ENV: "production" }), { global: true })
            .bundle()
            .pipe(fs.createWriteStream(`build/gen/${name}.js`));*/
    }
})();
