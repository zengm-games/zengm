// @flow

const build = require("./buildFuncs");

const rev = build.setTimestamps();

console.log("Minifying JS bundle...\nWARNING: This is likely to cause bugs");

for (const name of [`gen/ui-${rev}.js`, `gen/worker-${rev}.js`]) {
    build.minifyJS(name);
}
