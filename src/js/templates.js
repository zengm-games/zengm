// Disable template string rule because brfs can't handle them
/* eslint prefer-template: "off" */

const fs = require('fs');

module.exports = {
    accountUpdateCard: fs.readFileSync(__dirname + '/../templates/accountUpdateCard.html', 'utf8'),
    error: fs.readFileSync(__dirname + '/../templates/error.html', 'utf8'),
    resetPassword: fs.readFileSync(__dirname + '/../templates/resetPassword.html', 'utf8'),
};
