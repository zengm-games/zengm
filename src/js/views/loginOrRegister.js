const bbgmViewReact = require('../util/bbgmViewReact');
const LoginOrRegister = require('./views/LoginOrRegister');

module.exports = bbgmViewReact.init({
    id: "loginOrRegister",
    inLeague: false,
    Component: LoginOrRegister,
});
