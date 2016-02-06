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
        return league.loadGameAttributes(null).then(function () {
            return {
                godMode: g.godMode,
                injuries: [{
                    text: 'Enabled',
                    bool: true
                }, {
                    text: 'Disabled',
                    bool: false
                }],
                disableInjuries: g.disableInjuries,
                numGames: g.numGames,
                quarterLength: g.quarterLength,
                minRosterSize: g.minRosterSize,
                salaryCap: g.salaryCap / 1000,
                minPayroll: g.minPayroll / 1000,
                luxuryPayroll: g.luxuryPayroll / 1000,
                luxuryTax: g.luxuryTax,
                minContract: g.minContract / 1000,
                maxContract: g.maxContract / 1000
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

    document.getElementById("save-god-mode-options").addEventListener("click", function () {
console.log('save god mode options');
    });

    $("#help-luxury-tax").popover({
        title: "Luxury Tax",
        content: "Take the difference between a team's payroll and the luxury tax threshold. Multiply that by this number. The result is the penalty they have to pay."
    });
}

module.exports = bbgmView.init({
    id: "godMode",
    runBefore: [updateGodMode],
    uiFirst: uiFirst
});
