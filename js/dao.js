/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["db", "globals"], function (db, g) {
    "use strict";

    var players;

    // This needs to be used for anything that reads player stats!!!
    // Can also be used other places, but not essential
    players = {};

    // This is intended just for getting the data from the database. Anything more sophisticated is in core.player.filter
    // filter: Arbitrary JS function to run on output with array.filter
    // statsSeasons: if undefined/null, return all (needed for career totals, listing all years stats, etc). otherwise, it's an array of seasons to return (usually just one year, but can be two for oldStats)
    // statsPlayoffs: if undefined/null, default is false. if true, include both. This is because player.filter doesn't like being given only playoff stats, for some reason.
    // statsTids: if undefined/null, return any. otherwise, filter
    players.getAll = function (options, cb) {
        var playerStore, tx;

        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.index = options.index !== undefined ? options.index : null;
        options.key = options.key !== undefined ? options.key : null;
        options.statsSeasons = options.statsSeasons !== undefined ? options.statsSeasons : null;
        options.statsPlayoffs = options.statsPlayoffs !== undefined ? options.statsPlayoffs : false;
        options.statsTids = options.statsTids !== undefined ? options.statsTids : null;
        options.filter = options.filter !== undefined ? options.filter : null;

        playerStore = db.getObjectStore(options.ot, ["players", "playerStats"], "players"); // Doesn't really need playerStats all the time
        tx = playerStore.transaction;

        if (options.index !== null) {
            playerStore = playerStore.index(options.index);
        }

        playerStore.getAll(options.key).onsuccess = function (event) {
            var done, i, j, pid, players, playoffs, season, tid;

            players = event.target.result;

            if (options.filter !== null) {
                players = players.filter(options.filter);
            }

            tid = options.statsTids;

            done = 0;

            for (i = 0; i < players.length; i++) {
                pid = players[i].pid;

                /*if (options.statsSeasons === null) {
                    // All seasons!
                    // http://stackoverflow.com/a/26218219/786644
                    playerStatsStore.index("pid, season, tid, playoffs").getAll(IDBKeyRange.bound([pid], [pid, '']);
                } else {
                    // One season at a time!
                    for (j = 0; j < options.statsSeasons.length; j++) {
                        season = options.statsSeasons[j];

                        if (tid === null) {
                            // One team!
                            playerStatsStore.index("pid, season, tid, playoffs").getAll(IDBKeyRange.bound([pid, season, tid], [pid, season, tid, '']);
                        } else {
                            // All teams!
                            playerStatsStore.index("pid, season, tid, playoffs").getAll(IDBKeyRange.bound([pid, season], [pid, season, '']);
                        }
                    }
                }*/

                // Hacky way: always get all seasons for pid, then filter in JS
                if (options.statsSeasons === null || options.statsSeasons.length > 0) {
                    (function (i) {
                        tx.objectStore("playerStats").index("pid, season, tid, playoffs").getAll(IDBKeyRange.bound([pid], [pid, ''])).onsuccess = function (event) {
                            var playerStats;

                            playerStats = event.target.result;

                            // Due to indexes not necessarily handling all cases, still need to filter
                            players[i].stats = playerStats.filter(function (ps) {
                                // statsSeasons is defined, but this season isn't in it
                                if (options.statsSeasons !== null && options.statsSeasons.indexOf(ps.season) < 0) {
                                    return false;
                                }

                                // If options.statsPlayoffs is false, don't include playoffs. Otherwise, include both
                                if (!options.statsPlayoffs && options.statsPlayoffs !== ps.playoffs) {
                                    return false;
                                }

                                if (options.statsTids !== null && options.statsTids !== ps.tid) {
                                    return false;
                                }

                                return true;
                            });

                            done += 1;

                            if (done === players.length) {
// do I need to sort?
                                cb(players);
                            }
                        };
                    }(i));
                } else {
                    // No stats needed! Yay!
                    cb(players);
                }
            }
        };
    };

    // This should ultimately delete stats before writing
    players.put = function (options, cb) {
        var playerStore;

        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;

        if (!options.hasOwnProperty("p")) {
            throw new Error("Must supply player object p");
        }

        playerStore = db.getObjectStore(options.ot, "players", "players");

        if (options.hasOwnProperty("onsuccess")) {
            playerStore.put(options.p).onsuccess = options.onsuccess;
        } else {
            playerStore.put(options.p);
        }

        if (cb !== undefined) {
            cb();
        }
    }

    return {
        players: players
    };
});