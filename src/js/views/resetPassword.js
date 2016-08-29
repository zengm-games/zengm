const bbgmViewReact = require('../util/bbgmViewReact');
const ResetPassword = require('./views/ResetPassword');

function get(req) {
    return {
        token: req.params.token,
    };
}

function updateToken(inputs) {
    return {
        token: inputs.token,
    };
}

module.exports = bbgmViewReact.init({
    id: "resetPassword",
    get,
    inLeague: false,
    runBefore: [updateToken],
    Component: ResetPassword,
});
