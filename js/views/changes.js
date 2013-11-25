/**
 * @name views.changes
 * @namespace Changes.
 */
define(["ui", "data/changes", "util/bbgmView", "util/viewHelpers"], function (ui, changes, bbgmView, viewHelpers) {
    "use strict";

    function updateChanges() {
        return {
            changes: changes.all.slice(0).reverse()
        };
    }

    function uiFirst() {
        ui.title("Changes");
    }

    return bbgmView.init({
        id: "changes",
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateChanges],
        uiFirst: uiFirst
    });
});