// @flow

const fs = require('fs');
const UglifyJS = require('uglify-es');

console.log('Minifying JS bundle...\nWARNING: This is likely to cause bugs');

for (const name of ['ui', 'worker']) {
    const result = UglifyJS.minify(fs.readFileSync(`build/gen/${name}.js`, 'utf8'), {
        sourceMap: {
            content: 'inline',
            filename: `build/gen/${name}.js`,
            url: `${name}.js.map`,
        },
    });

    fs.writeFileSync(`build/gen/${name}.js`, result.code);
    fs.writeFileSync(`build/gen/${name}.js.map`, result.map);
}
