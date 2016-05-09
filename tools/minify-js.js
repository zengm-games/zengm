const fs = require('fs');
const UglifyJS = require("uglify-js");

const result = UglifyJS.minify("gen/app.js", {
    inSourceMap: "gen/app.js.map",
    outSourceMap: "gen/app.js.map",
    mangle: {
        except: ['require']
    }
});

fs.writeFileSync('gen/app.js', result.code);
fs.writeFileSync('gen/app.js.map', result.map);
