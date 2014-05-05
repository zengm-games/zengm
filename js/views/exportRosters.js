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
            var a, blob, cursor, found, i, j, json, p, url;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;

                found = false;

                // Keep players who played that season
                for (i = 0; i < p.ratings.length; i++) {
                    if (p.ratings[i].season === season) {
                        found = true;
                        break;
                    }
                }

                // Keep draft prospects
                if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
                    found = true;
                    i = 0; // So first rating entry is kept
                }

                // If no ratings entry for this year, skip
                if (!found) {
                    return cursor.continue();
                }

                // Find tid from that season
                for (j = 0; j < p.stats.length; j++) {
                    if (p.stats[j].season === season) {
                        p.tid = p.stats[j].tid;
                        break;
                    }
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
                json = JSON.stringify({startingSeason: season, players: players}, undefined, 2);
                blob = new Blob([json], {type: "application/json"});
                url = window.URL.createObjectURL(blob);

                a = document.createElement("a");
                a.download = "rosters-" + season + ".json";
                a.href = url;
                a.textContent = "Download Exported Rosters";
                a.dataset.noDavis = "true";
//                a.click(); // Works in Chrome to auto-download, but not Firefox

                document.getElementById("download-link").innerHTML = ""; // Clear "Generating..."
                document.getElementById("download-link").appendChild(a);

                // Delete object, eventually
                window.setTimeout(function () {
                    window.URL.revokeObjectURL(url);
                }, 60 * 1000);
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