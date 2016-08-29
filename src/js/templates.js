// Disable template string rule because brfs can't handle them
/* eslint prefer-template: "off" */

const fs = require('fs');

module.exports = {
    error: fs.readFileSync(__dirname + '/../templates/error.html', 'utf8'),
};
