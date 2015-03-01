/**
 * @name views.dashboard
 * @namespace Dashboard.
 */
define(["dao", "ui", "util/bbgmView", "util/viewHelpers"], function (dao, ui, bbgmView, viewHelpers) {
    "use strict";

    function updateDashboard() {
        return dao.leagues.getAll().then(function (leagues) {
            var i, newLeagueUrl, otherUrl;

            for (i = 0; i < leagues.length; i++) {
                if (leagues[i].teamRegion === undefined) {
                    leagues[i].teamRegion = "???";
                }
                if (leagues[i].teamName === undefined) {
                    leagues[i].teamName = "???";
                }
                delete leagues[i].tid;
            }

            // http/https crap
            if (window.location.protocol === "http:") {
                otherUrl = "https://" + window.location.hostname + "/";
            } else {
                otherUrl = "http://" + window.location.hostname + "/";
            }

            // Rewrite new league URL to https, except on localhost
            if (window.location.hostname.indexOf("basketball-gm") >= 0) {
                newLeagueUrl = "https://" + window.location.hostname + "/new_league";
            } else {
                newLeagueUrl = "/new_league";
            }

            return {
                leagues: leagues,
                newLeagueUrl: newLeagueUrl,
                otherUrl: otherUrl
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