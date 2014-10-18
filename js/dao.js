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
    // statSeasons: if null, return all. otherwise, it's an array of seasons to return
    // statPlayoffs: if null, return any. otherwise, filter
    // statTid: if null, return any. otherwise, filter
    players.getAll = function (options, cb) {
        var playerStore;

        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.index = options.index !== undefined ? options.index : null;
        options.key = options.key !== undefined ? options.key : null;
        options.filter = options.filter !== undefined ? options.filter : null;
        options.statSeasons = options.statSeasons !== undefined ? options.statSeasons : null;
        options.statPlayoffs = options.statPlayoffs !== undefined ? options.statPlayoffs : null;
        options.statTid = options.statTid !== undefined ? options.statTid : null;

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

                    if (options.statPlayoffs !== null && options.statPlayoffs !== ps.playoffs) {
                        return false;
                    }

                    if (options.statTid !== null && options.statTid !== ps.playoffs) {
                        return false;
                    }

                    return true;
                });
            }

            cb(players);
        };
    };

    return {
        players: players
    };
});