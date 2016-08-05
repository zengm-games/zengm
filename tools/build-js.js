// Used to be:
// browserify -d -p [minifyify --map app.js.map --output gen/app.js.map] js/app.js -o gen/app.js
// ...but then https://github.com/ben-ng/minifyify/issues/116 made it too complicated.

const browserify = require('browserify');
const envify = require('envify/custom');
const exorcist = require('exorcist');
const fs = require('fs');

const bundler = browserify('src/js/app.js', {debug: true});

// Disabled until it supports ES2015 out of the box (waiting on new UglifyJS relase, mostly)
/*bundler.plugin('minifyify', {
    map: '/gen/app.js.map',
    uglify: {
        // https://github.com/ben-ng/minifyify/issues/116
        mangle: {
            except: ['require']
        },
        sourceRoot: '/' // This has no affect on anything, I'm not sure why. Instead all my paths contain /gen, sigh.
    }
});

bundler.bundle((err, src, map) => {
    if (err) {
        throw err;
    }

    fs.writeFileSync('gen/app.js', src);
    fs.writeFileSync('gen/app.js.map', map);
});*/

console.log('Bundling JavaScript files...');

bundler
    .transform({global: true}, envify({NODE_ENV: 'production'}))
    .bundle()
    .pipe(exorcist('build/gen/app.js.map'))
    .pipe(fs.createWriteStream('build/gen/app.js', 'utf8'));
