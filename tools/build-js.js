// @flow

// Used to be:
// browserify -d -p [minifyify --map app.js.map --output gen/app.js.map] js/app.js -o gen/app.js
// ...but then it got too complicated, and this seemed easier

const browserify = require('browserify');
const blacklistify = require('blacklistify/custom');
const envify = require('envify/custom');
const exorcist = require('exorcist');
const fs = require('fs');

console.log('Bundling JavaScript files...');

const BLACKLIST = {
    ui: [/.*\/worker.*/],
    worker: [/.*\/ui.*/, /.*react.*/],
};

for (const name of ['ui', 'worker']) {
    browserify(`src/js/${name}/index.js`, {debug: true})
        .transform(blacklistify(BLACKLIST[name]))
        .transform({global: true}, envify({NODE_ENV: 'production'}))
        .bundle()
        .pipe(exorcist(`build/gen/${name}.js.map`))
        .pipe(fs.createWriteStream(`build/gen/${name}.js`));
}
