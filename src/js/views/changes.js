const ui = require('../ui');
const changes = require('../data/changes');
const bbgmView = require('../util/bbgmView');
const viewHelpers = require('../util/viewHelpers');

function updateChanges() {
    return {
        changes: changes.all.slice(0).reverse(),
    };
}

function uiFirst() {
    ui.title("Changes");
}

module.exports = bbgmView.init({
    id: "changes",
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateChanges],
    uiFirst,
});
