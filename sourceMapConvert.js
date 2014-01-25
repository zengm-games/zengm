// Problem is, my data says the column is always 68. But it's not. Why???

var fs = require('fs');
var sourceMap = require('source-map');

fs.readFile("./gen/app.js.map", 'utf8', function (err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }

    data = JSON.parse(data);

    var smc = new sourceMap.SourceMapConsumer(data);

    console.log(smc.originalPositionFor({
        line: 13,
        column: 14528
    }));
});