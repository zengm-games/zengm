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
        var playerStore;

        options = options !== undefined ? options : {};
        options.ot = options.ot !== undefined ? options.ot : null;
        options.index = options.index !== undefined ? options.index : null;
        options.key = options.key !== undefined ? options.key : null;
        options.statsSeasons = options.statsSeasons !== undefined ? options.statsSeasons : null;
        options.statsPlayoffs = options.statsPlayoffs !== undefined ? options.statsPlayoffs : false;
        options.statsTids = options.statsTids !== undefined ? options.statsTids : null;
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