/**
 * @name views.dashboard
 * @namespace Dashboard.
 */
define(["globals", "ui", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, $, bbgmView, helpers, viewHelpers) {
    "use strict";

    function updateDashboard(inputs, updateEvents) {
        var deferred;

        deferred = $.Deferred();

        g.dbm.transaction("leagues").objectStore("leagues").getAll().onsuccess = function (event) {
            var i, leagues;

            leagues = event.target.result;

            for (i = 0; i < leagues.length; i++) {
                if (leagues[i].teamRegion === undefined) {
                    leagues[i].teamRegion = "???";
                }
                if (leagues[i].teamName === undefined) {
                    leagues[i].teamName = "???";
                }
                delete leagues[i].tid;
            }

            deferred.resolve({
                leagues: leagues
            });
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Dashboard");
    }

    return bbgmView.init({
        id: "dashboard",
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateDashboard],
        uiFirst: uiFirst
    });
});