/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["db", "globals"], function (db, g) {
    "use strict";

    var players;

    players = {};

    // This is intended just for getting the data from the database. Anything more sophisticated is in core.player.filter
    // filter: Arbitrary JS function to run on output with array.filter
    // statSeasons: if undefined, return all. otherwise, it's an array of seasons to return
    // statPlayoffs: if undefined, default is false. if true, include both. This is because player.filter doesn't like being given only playoff stats, for some reason.
    // statTid: if undefined, return any. otherwise, filter
    players.getAll = function (options, cb) {
        var playerStore;

        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.index = options.index !== undefined ? options.index : null;
        options.key = options.key !== undefined ? options.key : null;
        options.statSeasons = options.statSeasons !== undefined ? options.statSeasons : null;
        options.statPlayoffs = options.statPlayoffs !== undefined ? options.statPlayoffs : false;
        options.statTid = options.statTid !== undefined ? options.statTid : null;
        options.filter = options.filter !== undefined ? options.filter : null;

        playerStore = db.getObjectStore(options.ot, "players", "players");

        if (options.index !== null) {
            playerStore = playerStore.index(options.index);
        }

        playerStore.getAll(options.key).onsuccess = function (event) {
            var i, players;

            players = event.target.result;

            if (options.filter !== null) {
                players = players.filter(options.filter);
            }

            for (i = 0; i < players.length; i++) {
                players[i].stats = players[i].stats.filter(function (ps) {
                    // statSeasons is defined, but this season isn't in it
                    if (options.statSeasons !== null && options.statSeasons.indexOf(ps.season) < 0) {
                        return false;
                    }

                    // If options.statPlayoffs is false, don't include playoffs. Otherwise, include both
                    if (!options.statPlayoffs && options.statPlayoffs !== ps.playoffs) {
                        return false;
                    }

                    if (options.statTid !== null && options.statTid !== ps.tid) {
                        return false;
                    }

                    return true;
                });
            }

            cb(players);
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