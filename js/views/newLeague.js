/**
 * @name views.newLeague
 * @namespace Create new league form.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, league, $, bbgmView, helpers, viewHelpers) {
    "use strict";

    function post(req) {
        var tid;

        $("#create-new-league").attr("disabled", "disabled");

        tid = Math.floor(req.params.tid);
        if (tid >= 0 && tid <= 29) {
            league.create(req.params.name, tid, req.params.players, function (lid) {
                ui.realtimeUpdate([], "/l/" + lid);
            });
        }
    }

    function updateNewLeague(inputs, updateEvents) {
        var deferred;

        deferred = $.Deferred();

        g.dbm.transaction("leagues").objectStore("leagues").openCursor(null, "prev").onsuccess = function (event) {
            var cursor, data, l, newLid, teams;

            cursor = event.target.result;
            if (cursor) {
                newLid = cursor.value.lid + 1;
            } else {
                newLid = 1;
            }

            teams = helpers.getTeams();

            deferred.resolve({
                name: "League " + newLid,
                teams: teams
            });
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        var select, teams, updatePopText;

        ui.title("Create New League");

        teams = helpers.getTeams();

        updatePopText = function () {
            var difficulty, team;

            team = teams[select.val()];

            if (team.popRank <= 5) {
                difficulty = "very easy";
            } else if (team.popRank <= 13) {
                difficulty = "easy";
            } else if (team.popRank <= 16) {
                difficulty = "normal";
            } else if (team.popRank <= 23) {
                difficulty = "hard";
            } else {
                difficulty = "very hard";
            }

            $("#pop-text").html("Region population: " + team.pop + " million, #" + team.popRank + " leaguewide<br>Difficulty: " + difficulty);
        };

        select = $("select[name='tid']");
        select.change(updatePopText);
        select.keyup(updatePopText);

        updatePopText();
    }

    return bbgmView.init({
        id: "newLeague",
        beforeReq: viewHelpers.beforeNonLeague,
        post: post,
        runBefore: [updateNewLeague],
        uiFirst: uiFirst
    });
});