/**
 * @name views.manual
 * @namespace Manual pages.
 */
define(["ui", "util/bbgmView", "util/viewHelpers"], function (ui, bbgmView, viewHelpers) {
    "use strict";

    function templateString(page) {
        var i, output, upperNext;

        output = "manual";
        upperNext = true;

        for (i = 0; i < page.length; i++) {
            if (upperNext) {
                output += page.charAt(i).toUpperCase();
                upperNext = false;
            } else if (page.charAt(i) === "_") {
                upperNext = true;
            } else {
                output += page.charAt(i);
            }
        }

        return output;
    }

    function get(req) {
        return {
            page: req.params.page !== undefined ? req.params.page : "overview"
        };
    }

    function updateManual(inputs) {
        return {
            page: inputs.page
        };
    }

    function uiFirst() {
        ui.title("Manual");
    }

    function uiEvery(updateEvents, vm) {
        ui.update({
            container: "manual-content",
            template: templateString(vm.page())
        });
    }

    return bbgmView.init({
        id: "manual",
        beforeReq: viewHelpers.beforeNonLeague,
        get: get,
        runBefore: [updateManual],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});