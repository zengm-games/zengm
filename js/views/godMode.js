/**
 * @name views.godMode
 * @namespace Enable or disable God Mode.
 */
define(["dao", "db", "globals", "ui", "util/bbgmView", "util/helpers"], function (dao, db, g, ui, bbgmView, helpers) {
    "use strict";

    function updateGodMode(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("toggleGodMode") >= 0) {
            // Make sure it's current
            return db.loadGameAttribute(null, "godMode").then(function () {
                return {
                    godMode: g.godMode
                };
            });
        }
    }

    function uiFirst() {
        ui.title("God Mode");

        document.getElementById("enable-god-mode").addEventListener("click", function () {
            dao.gameAttributes.set({godMode: true, godModeInPast: true, lastDbChange: Date.now()}).then(function () {
                ui.realtimeUpdate(["toggleGodMode"], helpers.leagueUrl(["god_mode"]));
            });
        });

        document.getElementById("disable-god-mode").addEventListener("click", function () {
            dao.gameAttributes.set({godMode: false, lastDbChange: Date.now()}).then(function () {
                ui.realtimeUpdate(["toggleGodMode"], helpers.leagueUrl(["god_mode"]));
            });
        });
    }

    return bbgmView.init({
        id: "godMode",
        runBefore: [updateGodMode],
        uiFirst: uiFirst
    });
});