/**
 * @name views.manual
 * @namespace Manual pages.
 */
define(["ui", "util/bbgmView", "util/viewHelpers"], function (ui, bbgmView, viewHelpers) {
    "use strict";

    function get(req) {
        return {
            page: req.params.page !== undefined ? req.params.page : "overview"
        };
    }

    function uiFirst(vm) {
        ui.title("Manual");
    }

    return bbgmView.init({
        id: "manualOverview",
        beforeReq: viewHelpers.beforeNonLeague,
        get: get,
        uiFirst: uiFirst
    });
});