/**
 * @name views.deleteOldData
 * @namespace Delete old league data.
 */
define(["db", "globals", "ui", "util/bbgmView"], function (db, g, ui, bbgmView) {
    "use strict";

    function get(req) {
        return {
            lid: parseInt(req.params.lid, 10)
        };
    }

    function post(req) {
        var deleteOldDataEl, deleteOldDataSuccessEl, tx;

        deleteOldDataEl = document.getElementById("delete-old-data");
        deleteOldDataEl.disabled = true;

        deleteOldDataSuccessEl = document.getElementById("delete-old-data-success");
        deleteOldDataSuccessEl.style.visibility = "hidden";

        tx = g.dbl.transaction(["games", "teams", "players"], "readwrite");

        if (req.params.hasOwnProperty("boxScores")) {
            tx.objectStore("games").openCursor().onsuccess = function (event) {
                var cursor;

                cursor = event.target.result;

                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
        }

        if (req.params.hasOwnProperty("teamStats")) {
            tx.objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, t;

                cursor = event.target.result;

                if (cursor) {
                    t = cursor.value;
                    t.seasons = [t.seasons[t.seasons.length - 1]];
                    t.stats = [t.stats[t.stats.length - 1]];
                    cursor.update(t);
                    cursor.continue();
                }
            };
        }

        if (req.params.hasOwnProperty("retiredPlayers")) {
            tx.objectStore("players").index("tid").openCursor(g.PLAYER.RETIRED).onsuccess = function (event) {
                var cursor;

                cursor = event.target.result;

                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
        }

        if (req.params.hasOwnProperty("playerStats")) {
            tx.objectStore("players").openCursor().onsuccess = function (event) {
                var cursor, p;

                cursor = event.target.result;

                if (cursor) {
                    p = cursor.value;
                    p.ratings = [p.ratings[p.ratings.length - 1]];
                    if (p.stats.length > 0) {
                        p.stats = [p.stats[p.stats.length - 1]];
                    }
                    cursor.update(p);
                    cursor.continue();
                }
            };
        }

        tx.oncomplete = function () {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                deleteOldDataEl.disabled = false;
                deleteOldDataSuccessEl.style.visibility = "visible";
            });
        };
    }

    function uiFirst(vm) {
        ui.title("Delete Old Data");
    }

    return bbgmView.init({
        id: "deleteOldData",
        get: get,
        post: post,
        uiFirst: uiFirst
    });
});