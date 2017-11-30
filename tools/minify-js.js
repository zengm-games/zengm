// @flow

const fs = require('fs');
const UglifyJS = require('uglify-es');
const build = require('./buildFuncs');

build.setTimestamps();

console.log('Minifying JS bundle...\nWARNING: This is likely to cause bugs');

for (const name of ['ui', 'worker']) {
    fs.readFile(`build/gen/${name}.js`, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }

        const result = UglifyJS.minify(data, {
            mangle: {
                // Needed until https://bugs.webkit.org/show_bug.cgi?id=171041 is fixed
                safari10: true,
            },
            sourceMap: {
                content: 'inline',
                filename: `build/gen/${name}.js`,
                url: `${name}.js.map`,
            },

        });

        fs.writeFile(`build/gen/${name}.js`, result.code, (err2) => {
            if (err2) {
                throw err2;
            }
        });
        fs.writeFile(`build/gen/${name}.js.map`, result.map, (err2) => {
            if (err2) {
                throw err2;
            }
        });
    });
}
