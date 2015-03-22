/**
 * @name views.newTeam
 * @namespace Pick a new team after being fired.
 */
define(["db", "globals", "ui", "core/league", "core/team", "util/bbgmView", "util/helpers"], function (db, g, ui, league, team, bbgmView, helpers) {
    "use strict";

    function get() {
        if (!g.gameOver && !g.godMode) {
            return {
                errorMessage: "You may only switch to another team after you're fired or when you're in <a href=\"" + helpers.leagueUrl(["god_mode"]) + "\">God Mode</a>."
            };
        }
    }

    function post(req) {
        var newUserTid;

        document.getElementById("new-team").disabled = true;

        newUserTid = parseInt(req.params.tid, 10);

        ui.updateStatus("Idle");
        ui.updatePlayMenu();

        league.setGameAttributesComplete({
            gameOver: false,
            userTid: newUserTid,
            userTids: [newUserTid],
            ownerMood: {
                wins: 0,
                playoffs: 0,
                money: 0
            },
            gracePeriodEnd: g.season + 3 // +3 is the same as +2 when staring a new league, since this happens at the end of a season
        }).then(function () {
            league.updateLastDbChange();
            league.updateMetaNameRegion(g.teamNamesCache[g.userTid], g.teamRegionsCache[g.userTid]);
            ui.realtimeUpdate([], helpers.leagueUrl([]));
        });
    }

    function updateTeamSelect() {
        return team.filter({
            attrs: ["tid", "region", "name"],
            seasonAttrs: ["winp"],
            season: g.season
        }).then(function (teams) {
            // Remove user's team (no re-hiring immediately after firing)
            teams.splice(g.userTid, 1);

            // If not in god mode, user must have been fired
            if (!g.godMode) {
                // Order by worst record
                teams.sort(function (a, b) { return a.winp - b.winp; });

                // Only get option of 5 worst
                teams = teams.slice(0, 5);
            }

            return {
                godMode: g.godMode,
                teams: teams
            };
        });
    }

    function uiFirst() {
        ui.title("New Team");
    }

    return bbgmView.init({
        id: "newTeam",
        get: get,
        post: post,
        runBefore: [updateTeamSelect],
        uiFirst: uiFirst
    });
});