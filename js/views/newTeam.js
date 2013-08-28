/**
 * @author SV
 * @name views.newTeam
 * @namespace New Team.
 */
define(["db", "globals", "ui", "core/season", "core/team", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, season, team, $, bbgmView, helpers, viewHelpers) {
    "use strict";
    
    function get(req) {
        if (!(g.gameOver)) {
            return {
                errorMessage: "You may only select another team when you have been fired."
            };
        }
    }

    function post(req) {
        var tid;
        $("#new-team").attr("disabled", "disabled");
        tid=Math.floor(req.params.tid);
        ui.updateStatus("Idle");
        ui.updatePlayMenu();
        db.setGameAttributes({
            gameOver: false,
            userTid: tid,
            ownerMood: {
                wins: 0,
                playoffs: 0,
                money: 0
            }
        },
        function (lid) {
            ui.realtimeUpdate([], helpers.leagueUrl([]));
        });
    }
    function updateTeamSelect() {
        var deferred;
        deferred = $.Deferred();
        
        var bottomTeams, i;
        
        team.filter({
            attrs: ["tid", "abbrev", "region", "name", "cid"],
            seasonAttrs: ["winp", "playoffRoundsWon"],
            season: g.season-1
        }, function (teams) {
            teams.sort(function (a, b) {
                return a.winp - b.winp;
            });
            bottomTeams=teams.slice(0,5);
            deferred.resolve({
                teams: bottomTeams,
                tid: bottomTeams.tid,
                abbrev: bottomTeams.abbrev,
                region: bottomTeams.region,
                name: bottomTeams.name
            });
        });
        return deferred.promise();
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