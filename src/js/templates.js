// Disable template string rule because brfs can't handle them
/* eslint prefer-template: "off" */

const fs = require('fs');

module.exports = {
    account: fs.readFileSync(__dirname + '/../templates/account.html', 'utf8'),
    accountUpdateCard: fs.readFileSync(__dirname + '/../templates/accountUpdateCard.html', 'utf8'),
    dashboard: fs.readFileSync(__dirname + '/../templates/dashboard.html', 'utf8'),
    deleteLeague: fs.readFileSync(__dirname + '/../templates/deleteLeague.html', 'utf8'),
    deleteOldData: fs.readFileSync(__dirname + '/../templates/deleteOldData.html', 'utf8'),
    error: fs.readFileSync(__dirname + '/../templates/error.html', 'utf8'),
    leagueLayout: fs.readFileSync(__dirname + '/../templates/leagueLayout.html', 'utf8'),
    loginOrRegister: fs.readFileSync(__dirname + '/../templates/loginOrRegister.html', 'utf8'),
    lostPassword: fs.readFileSync(__dirname + '/../templates/lostPassword.html', 'utf8'),
    manual: fs.readFileSync(__dirname + '/../templates/manual.html', 'utf8'),
    manualCustomRosters: fs.readFileSync(__dirname + '/../templates/manualCustomRosters.html', 'utf8'),
    manualOverview: fs.readFileSync(__dirname + '/../templates/manualOverview.html', 'utf8'),
    newLeague: fs.readFileSync(__dirname + '/../templates/newLeague.html', 'utf8'),
    resetPassword: fs.readFileSync(__dirname + '/../templates/resetPassword.html', 'utf8'),
};
