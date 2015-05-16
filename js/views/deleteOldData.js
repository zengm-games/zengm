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
        var deleteOldDataEl, deleteOldDataSuccessEl, toDelete, tx;

        deleteOldDataEl = document.getElementById("delete-old-data");
        deleteOldDataEl.disabled = true;

        deleteOldDataSuccessEl = document.getElementById("delete-old-data-success");
        deleteOldDataSuccessEl.style.visibility = "hidden";

        tx = dao.tx(["games", "teams", "players", "playerStats"], "readwrite");

        if (req.params.hasOwnProperty("boxScores")) {
            dao.games.clear({ot: tx});
        }

        if (req.params.hasOwnProperty("teamStats") || req.params.hasOwnProperty("teamHistory")) {
            dao.teams.iterate({
                ot: tx,
                callback: function (t) {
                    if (req.params.hasOwnProperty("teamStats")) {
                        t.stats = [t.stats[t.stats.length - 1]];
                    }
                    if (req.params.hasOwnProperty("teamHistory")) {
                        t.seasons = [t.seasons[t.seasons.length - 1]];
                    }
                    return t;
                }
            });
        }

        if (req.params.hasOwnProperty("retiredPlayers")) {
            toDelete = [];

            dao.players.iterate({
                ot: tx,
                index: "tid",
                key: g.PLAYER.RETIRED,
                callback: function (p) {
                    toDelete.push(p.pid);
                    return dao.players.delete({ot: tx, key: p.pid});
                }
            }).then(function () {
                dao.playerStats.iterate({
                    ot: tx,
                    callback: function (ps) {
                        if (toDelete.indexOf(ps.pid) >= 0) {
                            return dao.playerStats.delete({ot: tx, key: ps.psid});
                        }
                    }
                });
            });
        } else if (req.params.hasOwnProperty("retiredPlayersUnnotable")) {
            toDelete = [];

            dao.players.iterate({
                ot: tx,
                index: "tid",
                key: g.PLAYER.RETIRED,
                callback: function (p) {
                    if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                        toDelete.push(p.pid);
                        return dao.players.delete({ot: tx, key: p.pid});
                    }
                }
            }).then(function () {
                dao.playerStats.iterate({
                    ot: tx,
                    callback: function (ps) {
                        if (toDelete.indexOf(ps.pid) >= 0) {
                            return dao.playerStats.delete({ot: tx, key: ps.psid});
                        }
                    }
                });
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
        } else if (req.params.hasOwnProperty("playerStatsUnnotable")) {
            toDelete = [];

            dao.players.iterate({
                ot: tx,
                callback: function (p) {
                    if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                        p.ratings = [p.ratings[p.ratings.length - 1]];
                        toDelete.push(p.pid);
                    }
                    return p;
                }
            }).then(function () {
                dao.playerStats.iterate({
                    ot: tx,
                    callback: function (ps) {
                        if (ps.season < g.season && toDelete.indexOf(ps.pid) >= 0) {
                            return dao.playerStats.delete({ot: tx, key: ps.psid});
                        }
                    }
                });
            });
        }

        tx.complete().then(function () {
            league.updateLastDbChange();
            deleteOldDataEl.disabled = false;
            deleteOldDataSuccessEl.style.visibility = "visible";
        });
    }

    function uiFirst() {
        ui.title("Delete Old Data");
    }

    return bbgmView.init({
        id: "deleteOldData",
        get: get,
        post: post,
        uiFirst: uiFirst
    });
});