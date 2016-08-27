const changes = require('../data/changes');
const bbgmViewReact = require('../util/bbgmViewReact');
const Changes = require('./views/Changes');

function updateChanges() {
    return {
        changes: changes.all.slice(0).reverse(),
    };
}

module.exports = bbgmViewReact.init({
    id: "changes",
    inLeague: false,
    runBefore: [updateChanges],
    Component: Changes,
});
