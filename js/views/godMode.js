/**
 * @name views.godMode
 * @namespace Enable or disable God Mode.
 */
define(["db", "globals", "ui", "lib/jquery", "util/bbgmView", "util/helpers"], function (db, g, ui, $, bbgmView, helpers) {
    "use strict";

    function updateGodMode(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("toggleGodMode") >= 0) {
            deferred = $.Deferred();

            // Make sure it's current
            db.loadGameAttribute(null, "godMode", function () {
                deferred.resolve({
                    godMode: g.godMode
                });
            });

            return deferred.promise();
        }
    }

    function uiFirst() {
        ui.title("God Mode");

        document.getElementById("enable-god-mode").addEventListener("click", function () {
            db.setGameAttributes({godMode: true, godModeInPast: true, lastDbChange: Date.now()}, function () {
                ui.realtimeUpdate(["toggleGodMode"], helpers.leagueUrl(["god_mode"]));
            });
        });

        document.getElementById("disable-god-mode").addEventListener("click", function () {
            db.setGameAttributes({godMode: false, lastDbChange: Date.now()}, function () {
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