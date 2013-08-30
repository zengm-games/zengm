/**
 * @name views.editTeamNames
 * @namespace Edit Team Names.
 */
define(["db", "globals", "ui", "core/team", "lib/jquery", "util/bbgmView", "util/helpers"], function (db, g, ui, team, $, bbgmView, helpers) {
    "use strict";
    
    function post(req) {
        g.dbl.transaction("teams", "readwrite").objectStore("teams").openCursor().onsuccess = function (event) {
            var cursor, t;
            cursor = event.target.result;
            if (cursor) {
                t = cursor.value;
                t.region = req.params.region[t.tid];
                t.name = req.params.name[t.tid];
                t.seasons[t.seasons.length - 1].pop = req.params.population[t.tid];
                cursor.update(t);
                cursor.continue();
            } else {
                ui.realtimeUpdate([], helpers.leagueUrl([]));
            }
        }
        db.setGameAttributes({teamRegionsCache: req.params.region});
        db.setGameAttributes({teamNamesCache: req.params.name});
    }
    
    function updateTeamInfo() {
        var deferred;
        deferred = $.Deferred();

        team.filter({
            attrs: ["tid", "region", "name", "seasons"],
            seasonAttrs: ["pop"],
            season: g.season
        }, function (teams) {
            deferred.resolve({
                teams: teams,
                region: teams.region,
                name: teams.name,
                pop: _.last(teams).seasons[0].pop
            });
        });
        
        return deferred.promise();
    }

    function uiFirst() {
        ui.title("Edit Team Names");
    }

    return bbgmView.init({
        id: "editTeamNames",
        post: post,
        runBefore: [updateTeamInfo],
        uiFirst: uiFirst
    });
});