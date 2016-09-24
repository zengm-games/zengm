// @flow

const fs = require('fs');
const UglifyJS = require('uglify-js');

console.log('Minifying JS bundle...\nWARNING: This is likely to cause bugs');

const result = UglifyJS.minify('build/gen/app.js', {
    inSourceMap: 'build/gen/app.js.map',
    outSourceMap: 'build/gen/app.js.map',
    sourceMapUrl: 'app.js.map',
});

fs.writeFileSync('build/gen/app.js', result.code);
fs.writeFileSync('build/gen/app.js.map', result.map);
