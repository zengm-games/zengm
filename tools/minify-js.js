const fs = require('fs');
const UglifyJS = require("uglify-js");

const result = UglifyJS.minify("build/gen/app.js", {
    inSourceMap: "build/gen/app.js.map",
    outSourceMap: "build/gen/app.js.map",
    mangle: {
        except: ['require']
    }
});

fs.writeFileSync('build/gen/app.js', result.code);
fs.writeFileSync('build/gen/app.js.map', result.map);
