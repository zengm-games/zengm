// Disable template string rule because brfs can't handle them
/* eslint prefer-template: "off" */

const fs = require('fs');

module.exports = {
    account: fs.readFileSync(__dirname + '/../templates/account.html', 'utf8'),
    accountUpdateCard: fs.readFileSync(__dirname + '/../templates/accountUpdateCard.html', 'utf8'),
    deleteOldData: fs.readFileSync(__dirname + '/../templates/deleteOldData.html', 'utf8'),
    error: fs.readFileSync(__dirname + '/../templates/error.html', 'utf8'),
    loginOrRegister: fs.readFileSync(__dirname + '/../templates/loginOrRegister.html', 'utf8'),
    lostPassword: fs.readFileSync(__dirname + '/../templates/lostPassword.html', 'utf8'),
    resetPassword: fs.readFileSync(__dirname + '/../templates/resetPassword.html', 'utf8'),
};
