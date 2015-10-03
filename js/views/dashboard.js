/**
 * @name views.dashboard
 * @namespace Dashboard.
 */
'use strict';

var dao = require('../dao');
var ui = require('../ui');
var bbgmView = require('../util/bbgmView');
var viewHelpers = require('../util/viewHelpers');

function updateDashboard() {
    return dao.leagues.getAll().then(function (leagues) {
        var i, otherUrl;

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
            if (leagues.length === 0 && window.location.hostname.indexOf("basketball-gm") >= 0) {
                window.location.replace("https://" + window.location.hostname + "/");
            }
            otherUrl = "https://" + window.location.hostname + "/";
        } else {
            otherUrl = "http://" + window.location.hostname + "/";
        }

        return {
            leagues: leagues,
            otherUrl: otherUrl
        };
    });
}

function uiFirst() {
    ui.title("Dashboard");
}

module.exports = bbgmView.init({
    id: "dashboard",
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateDashboard],
    uiFirst: uiFirst
});
