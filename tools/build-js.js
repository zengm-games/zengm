// Used to be:
// browserify -d -p [minifyify --map app.js.map --output gen/app.js.map] js/app.js -o gen/app.js
// ...but then it got too complicated, and this seemed easier

const browserify = require('browserify');
const envify = require('envify/custom');
const exorcist = require('exorcist');
const fs = require('fs');

const bundler = browserify('src/js/app.js', {debug: true});

console.log('Bundling JavaScript files...');

bundler
    .transform({global: true}, envify({NODE_ENV: 'production'}))
    .bundle()
    .pipe(exorcist('build/gen/app.js.map'))
    .pipe(fs.createWriteStream('build/gen/app.js', 'utf8'));
