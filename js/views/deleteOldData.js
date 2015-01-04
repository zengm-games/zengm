/**
 * @name views.deleteOldData
 * @namespace Delete old league data.
 */
define(["dao", "globals", "ui", "core/league", "util/bbgmView"], function (dao, g, ui, league, bbgmView) {
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

        tx = dao.tx(["games", "teams", "players", "playerStats"], "readwrite");

        if (req.params.hasOwnProperty("boxScores")) {
            dao.games.clear({ot: tx});
        }

        if (req.params.hasOwnProperty("teamStats")) {
            dao.teams.iterate({
                ot: tx,
                callback: function (t) {
                    t.seasons = [t.seasons[t.seasons.length - 1]];
                    t.stats = [t.stats[t.stats.length - 1]];
                    return t;
                }
            });
        }

        if (req.params.hasOwnProperty("retiredPlayers")) {
            dao.players.iterate({
                ot: tx,
                index: "tid",
                key: g.PLAYER.RETIRED,
                callback: function (p) {
                    return dao.players.delete({ot: tx, key: p.pid});
                }
            });
        }

        if (req.params.hasOwnProperty("playerStats")) {
            dao.players.iterate({
                ot: tx,
                callback: function (p) {
                    p.ratings = [p.ratings[p.ratings.length - 1]];
                    return p;
                }
            });
            dao.playerStats.iterate({
                ot: tx,
                callback: function (ps) {
                    if (ps.season < g.season) {
                        return dao.playerStats.delete({ot: tx, key: ps.psid});
                    }
                }
            });
        }

        tx.complete().then(function () {
            league.setGameAttributes({lastDbChange: Date.now()}).then(function () {
                deleteOldDataEl.disabled = false;
                deleteOldDataSuccessEl.style.visibility = "visible";
            });
        });
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