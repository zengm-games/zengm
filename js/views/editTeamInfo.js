/**
 * @name views.editTeamInfo
 * @namespace Edit Team Info.
 */
define(["db", "globals", "ui", "core/team", "lib/jquery", "util/bbgmView", "util/helpers"], function (db, g, ui, team, $, bbgmView, helpers) {
    "use strict";

    function post(req) {
        var button;

        button = document.getElementById("edit-team-info");
        button.disabled = true;

        g.dbl.transaction("teams", "readwrite").objectStore("teams").openCursor().onsuccess = function (event) {
            var cursor, t;

            cursor = event.target.result;
            if (cursor) {
                t = cursor.value;
                t.region = req.params.region[t.tid];
                t.name = req.params.name[t.tid];
                t.seasons[t.seasons.length - 1].pop = parseFloat(req.params.pop[t.tid]);
                cursor.update(t);
                cursor.continue();
            } else {
                // Updating cached values for team regions and team names for easy access.
                db.setGameAttributes({
                    teamRegionsCache: req.params.region,
                    teamNamesCache: req.params.name
                }, function () {
                    button.disabled = false;
                    ui.realtimeUpdate([], helpers.leagueUrl(["edit_team_info"]));
                });
            }
        };
    }

    function updateTeamInfo() {
        var deferred;
        deferred = $.Deferred();

        team.filter({
            attrs: ["tid", "region", "name"],
            seasonAttrs: ["pop"],
            season: g.season
        }, function (teams) {
            var i;

            for (i = 0; i < teams.length; i++) {
                teams[i].pop = helpers.round(teams[i].pop, 6);
            }

            deferred.resolve({
                teams: teams
            });
        });

        return deferred.promise();
    }

    function uiFirst() {
        ui.title("Edit Team Names");
    }

    return bbgmView.init({
        id: "editTeamInfo",
        post: post,
        runBefore: [updateTeamInfo],
        uiFirst: uiFirst
    });
});