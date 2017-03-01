// @flow

const fs = require('fs');
const UglifyJS = require('uglify-js');

console.log('Minifying JS bundle...\nWARNING: This is likely to cause bugs');

for (const name of ['ui', 'worker']) {
    const result = UglifyJS.minify(`build/gen/${name}.js`, {
        inSourceMap: `build/gen/${name}.js.map`,
        outSourceMap: `build/gen/${name}.js.map`,
        sourceMapUrl: `${name}.js.map`,
    });

    fs.writeFileSync(`build/gen/${name}.js`, result.code);
    fs.writeFileSync(`build/gen/${name}.js.map`, result.map);
}
