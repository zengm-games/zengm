/**
 * @name views.multiTeamMode
 * @namespace Enable or disable Multi Team Mode.
 */
define(["globals", "ui", "core/league", "util/bbgmView", "util/helpers"], function (g, ui, league, bbgmView, helpers) {
    "use strict";

    function updateMultiTeamMode(inputs, updateEvents) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
            // Make sure it's current
            return league.loadGameAttribute(null, "godMode").then(function () {
                return {
                    userTids: g.userTids
                };
            });
        }
    }

    function uiFirst() {
        ui.title("Multi Team Mode");

/*        document.getElementById("enable-god-mode").addEventListener("click", function () {
            league.setGameAttributesComplete({godMode: true, godModeInPast: true}).then(function () {
                league.updateLastDbChange();
                ui.realtimeUpdate(["toggleGodMode"], helpers.leagueUrl(["god_mode"]));
            });
        });

        document.getElementById("disable-god-mode").addEventListener("click", function () {
            league.setGameAttributesComplete({godMode: false}).then(function () {
                league.updateLastDbChange();
                ui.realtimeUpdate(["toggleGodMode"], helpers.leagueUrl(["god_mode"]));
            });
        });*/
    }

    return bbgmView.init({
        id: "multiTeamMode",
        runBefore: [updateMultiTeamMode],
        uiFirst: uiFirst
    });
});