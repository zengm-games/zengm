const changes = require('../data/changes');
const bbgmViewReact = require('../util/bbgmViewReact');
const viewHelpers = require('../util/viewHelpers');
const Changes = require('./views/Changes');

function updateChanges() {
    return {
        changes: changes.all.slice(0).reverse(),
    };
}

module.exports = bbgmViewReact.init({
    id: "changes",
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateChanges],
    Component: Changes,
});
