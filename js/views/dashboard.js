/**
 * @name views.dashboard
 * @namespace Dashboard.
 */
define(["dao", "ui", "util/bbgmView", "util/viewHelpers"], function (dao, ui, bbgmView, viewHelpers) {
    "use strict";

    function updateDashboard() {
        return dao.leagues.getAll().then(function (leagues) {
            var i;

            for (i = 0; i < leagues.length; i++) {
                if (leagues[i].teamRegion === undefined) {
                    leagues[i].teamRegion = "???";
                }
                if (leagues[i].teamName === undefined) {
                    leagues[i].teamName = "???";
                }
                delete leagues[i].tid;
            }

            return {
                leagues: leagues
            };
        });
    }

    function uiFirst() {
        ui.title("Dashboard");
    }

    return bbgmView.init({
        id: "dashboard",
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateDashboard],
        uiFirst: uiFirst
    });
});