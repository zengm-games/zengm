'use strict';

var ui = require('../ui');
var changes = require('../data/changes');
var bbgmView = require('../util/bbgmView');
var viewHelpers = require('../util/viewHelpers');

function updateChanges() {
    return {
        changes: changes.all.slice(0).reverse()
    };
}

function uiFirst() {
    ui.title("Changes");
}

module.exports = bbgmView.init({
    id: "changes",
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateChanges],
    uiFirst: uiFirst
});
