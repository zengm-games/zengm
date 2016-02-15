'use strict';

var g = require('../globals');
var ui = require('../ui');
var league = require('../core/league');
var bbgmView = require('../util/bbgmView');

function get(req) {
    return {
        lid: parseInt(req.params.lid, 10)
    };
}

function post(req) {
    var deleteOldDataEl, deleteOldDataSuccessEl, toDelete;

    deleteOldDataEl = document.getElementById("delete-old-data");
    deleteOldDataEl.disabled = true;

    deleteOldDataSuccessEl = document.getElementById("delete-old-data-success");
    deleteOldDataSuccessEl.style.visibility = "hidden";

    g.dbl.tx(["games", "teams", "players", "playerStats"], "readwrite", function (tx) {
        if (req.params.hasOwnProperty("boxScores")) {
            tx.games.clear();
        }

        if (req.params.hasOwnProperty("teamStats") || req.params.hasOwnProperty("teamHistory")) {
            tx.teams.iterate(function (t) {
                if (req.params.hasOwnProperty("teamStats")) {
                    t.stats = [t.stats[t.stats.length - 1]];
                }
                if (req.params.hasOwnProperty("teamHistory")) {
                    t.seasons = [t.seasons[t.seasons.length - 1]];
                }
                return t;
            });
        }

        if (req.params.hasOwnProperty("retiredPlayers")) {
            toDelete = [];

            tx.players.index('tid').iterate(g.PLAYER.RETIRED, function (p) {
                toDelete.push(p.pid);
                return tx.players.delete(p.pid);
            }).then(function () {
                tx.playerStats.iterate(function (ps) {
                    if (toDelete.indexOf(ps.pid) >= 0) {
                        return tx.playerStats.delete(ps.psid);
                    }
                });
            });
        } else if (req.params.hasOwnProperty("retiredPlayersUnnotable")) {
            toDelete = [];

            tx.players.index('tid').iterate(g.PLAYER.RETIRED, function (p) {
                if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                    toDelete.push(p.pid);
                    return tx.players.delete(p.pid);
                }
            }).then(function () {
                tx.playerStats.iterate(function (ps) {
                    if (toDelete.indexOf(ps.pid) >= 0) {
                        return tx.playerStats.delete(ps.psid);
                    }
                });
            });
        }

        if (req.params.hasOwnProperty("playerStats")) {
            tx.players.iterate(function (p) {
                p.ratings = [p.ratings[p.ratings.length - 1]];
                return p;
            });
            tx.playerStats.iterate(function (ps) {
                if (ps.season < g.season) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        } else if (req.params.hasOwnProperty("playerStatsUnnotable")) {
            toDelete = [];

            tx.players.iterate(function (p) {
                if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                    p.ratings = [p.ratings[p.ratings.length - 1]];
                    toDelete.push(p.pid);
                }
                return p;
            }).then(function () {
                tx.playerStats.iterate(function (ps) {
                    if (ps.season < g.season && toDelete.indexOf(ps.pid) >= 0) {
                        return tx.playerStats.delete(ps.psid);
                    }
                });
            });
        }
    }).then(function () {
        league.updateLastDbChange();
        deleteOldDataEl.disabled = false;
        deleteOldDataSuccessEl.style.visibility = "visible";
    });
}

function uiFirst() {
    ui.title("Delete Old Data");
}

module.exports = bbgmView.init({
    id: "deleteOldData",
    get: get,
    post: post,
    uiFirst: uiFirst
});
