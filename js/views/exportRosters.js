/**
 * @name views.exportRosters
 * @namespace Export rosters.
 */
define(["globals", "ui", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, $, bbgmView, helpers, viewHelpers) {
    "use strict";

    function post(req) {
        var players, season;

        $("#download-link").html("Generating...");

        season = helpers.validateSeason(req.params.season);

        players = [];

        g.dbl.transaction("players").objectStore("players").openCursor().onsuccess = function (event) {
            var cursor, found, i, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;

                found = false;
                for (i = 0; i < p.ratings.length; i++) {
                    if (p.ratings[i].season === season) {
                        found = true;
                        break;
                    }
                }

                // If no ratings entry for this year, skip
                if (!found) {
                    return cursor.continue();
                }

                // Delete anything we can get away with
                p.ratings = [p.ratings[i]]; // Multiple seasons of ratings would take up too much space
                delete p.ratings[0].season; // Will be set to g.startingSeason when imported
                delete p.stats; // Stats would take up too much space
                delete p.awards;
                delete p.college;
                delete p.salaries;
                delete p.statsTids;

                players.push(p);

                cursor.continue();
            } else {
                // I should be able to just use window.encodeURI to skip the base64 step, but Firefox can't fully download some URIs (like ones containing #)
                $("#download-link").html('<a href="data:application/json;base64,' + window.btoa(JSON.stringify({players: players})) + '" download="rosters-' + season + '.json">Download Exported Rosters</a>');
            }
        };
    }

    function updateExportRosters() {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        vars = {
            seasons: helpers.getSeasons(g.season)
        };
        vars.seasons.reverse();

        deferred.resolve(vars);

        return deferred.promise();
    }

    function uiFirst() {
        ui.title("Export Rosters");
    }

    return bbgmView.init({
        id: "exportRosters",
        post: post,
        runBefore: [updateExportRosters],
        uiFirst: uiFirst
    });
});