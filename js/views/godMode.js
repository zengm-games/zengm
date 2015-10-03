/**
 * @name views.godMode
 * @namespace Enable or disable God Mode.
 */
'use strict';

var g = require('../globals');
var ui = require('../ui');
var league = require('../core/league');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

function updateGodMode(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("toggleGodMode") >= 0) {
        // Make sure it's current
        return league.loadGameAttribute(null, "godMode").then(function () {
            return {
                godMode: g.godMode
            };
        });
    }
}

function uiFirst() {
    ui.title("God Mode");

    document.getElementById("enable-god-mode").addEventListener("click", function () {
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
    });
}

module.exports = bbgmView.init({
    id: "godMode",
    runBefore: [updateGodMode],
    uiFirst: uiFirst
});
