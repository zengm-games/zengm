/**
 * @name views.multiTeamMode
 * @namespace Enable or disable Multi Team Mode.
 */
define(["globals", "ui", "core/league", "lib/knockout", "util/bbgmView"], function (g, ui, league, ko, bbgmView) {
    "use strict";

    function updateMultiTeamMode(inputs, updateEvents) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
            // Make sure it's current
            return league.loadGameAttribute(null, "godMode").then(function () {
                var i, teams;

                teams = [];
                for (i = 0; i < g.numTeams; i++) {
                    teams.push({
                        tid: i,
                        name: g.teamRegionsCache[i] + " " + g.teamNamesCache[i]
                    });
                }

                return {
                    userTids: g.userTids,
                    teams: teams
                };
            });
        }
    }

    function uiFirst(vm) {
        ui.title("Multi Team Mode");

        ko.computed(function () {
            var gameAttributes, newUserTids;

            newUserTids = vm.userTids();

            if (newUserTids.length < 1) {
                return;
            }

            if (JSON.stringify(newUserTids) !== JSON.stringify(g.userTids)) {
                gameAttributes = {userTids: newUserTids};
                if (newUserTids.indexOf(g.userTid) < 0) {
                    gameAttributes.userTid = newUserTids[0];
                }
                league.setGameAttributes(null, gameAttributes);

                if (newUserTids.length === 1) {
                    league.updateMetaNameRegion(g.teamNamesCache[newUserTids[0]], g.teamRegionsCache[newUserTids[0]]);
                } else {
                    league.updateMetaNameRegion("Multi Team Mode", "");
                }

                league.updateLastDbChange();
            }
        });
    }

    return bbgmView.init({
        id: "multiTeamMode",
        runBefore: [updateMultiTeamMode],
        uiFirst: uiFirst
    });
});