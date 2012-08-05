/**
 * @name db
 * @namespace Functions that directly access an IndexedDB database.
 */
define(["util/helpers"], function (helpers) {
    "use strict";

    function connect_meta() {
        var request;

        console.log('Connecting to database "meta"');
        request = g.indexedDB.open("meta", 1);
        request.onerror = function (event) {
            console.log("Connection error");
        };
        request.onblocked = function () { g.dbm.close(); };
        request.onupgradeneeded = function (event) {
            var i, leagueStore, teams, teamStore;
            console.log("Upgrading meta database");

            g.dbm = event.target.result;

            leagueStore = g.dbm.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
            teamStore = g.dbm.createObjectStore("teams", {keyPath: "tid"});
            teamStore.createIndex("cid", "cid", {unique: false});
            teamStore.createIndex("did", "did", {unique: false});

            teams = helpers.getTeams();
            for (i = 0; i < teams.length; i++) {
                teamStore.add(teams[i]);
            }
        };
        return request;
    }

    function connect_league(lid) {
        var request;

        console.log('Connecting to database "league' + lid + '"');
        request = g.indexedDB.open("league" + lid, 1);
        request.onerror = function (event) {
            console.log("Connection error");
        };
        request.onblocked = function () { g.dbl.close(); };
        request.onupgradeneeded = function (event) {
            var awardsStore, gameStore, playerStore, playoffSeriesStore, releasedPlayersStore, scheduleStore, teamStore, tradeStore;

            console.log("Upgrading league" + lid + " database");

            g.dbl = event.target.result;

            // rid ("row id") is used as the keyPath for objects without an innate unique identifier
            playerStore = g.dbl.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
            teamStore = g.dbl.createObjectStore("teams", {keyPath: "tid"});
            gameStore = g.dbl.createObjectStore("games", {keyPath: "gid"});
            scheduleStore = g.dbl.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
            playoffSeriesStore = g.dbl.createObjectStore("playoffSeries", {keyPath: "season"});
            releasedPlayersStore = g.dbl.createObjectStore("releasedPlayers", {keyPath: "rid", autoIncrement: true});
            awardsStore = g.dbl.createObjectStore("awards", {keyPath: "season"});
            tradeStore = g.dbl.createObjectStore("trade", {keyPath: "rid"});

            playerStore.createIndex("tid", "tid", {unique: false});
            playerStore.createIndex("draftYear", "draftYear", {unique: false});
            playerStore.createIndex("retiredYear", "retiredYear", {unique: false});
            playerStore.createIndex("ratings.season", "ratings.season", {unique: false});
            playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
//                playerStore.createIndex("stats.season", "stats.season", {unique: false, multiEntry: true});
//                playerStore.createIndex("stats.playoffs", "stats.playoffs", {unique: false, multiEntry: true});
            teamStore.createIndex("cid", "cid", {unique: false});
            teamStore.createIndex("did", "did", {unique: false});
//                teamStore.createIndex("stats.playoffs", "stats.playoffs", {unique: false});
//                gameStore.createIndex("tid", "tid", {unique: false}); // Not used because it's useless without oppTid checking too
            gameStore.createIndex("season", "season", {unique: false});
            releasedPlayersStore.createIndex("tid", "tid", {unique: false});
            releasedPlayersStore.createIndex("contractExp", "contractExp", {unique: false});
        };
        return request;
    }


    /**
     * Get an object store based on input which may be the desired object store, a transaction to be used, or null.
     * 
     * This allows the other db.* functions to use transactions or object stores that have already been defined, which often makes things a lot faster.
     * 
     * @memberOf db
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction to be used; if null is passed, then a new transaction will be used.
     * @param {(string|Array.<string>)} transactionObjectStores The object stores to open a transaction with, if necessary.
     * @param {?string} objectStore The object store to return. If null, return a transaction.
     * @return {(IDBObjectStore|IDBTransaction)} The requested object store or transaction.
     */
    function getObjectStore(ot, transactionObjectStores, objectStore) {
        if (ot instanceof IDBObjectStore) {
            return ot;
        }
        if (ot instanceof IDBTransaction) {
            if (objectStore !== null) {
                return ot.objectStore(objectStore);
            }
            return ot; // Return original transaction
        }
        if (objectStore === null) {
            return g.dbl.transaction(transactionObjectStores, "readwrite");
        }
        return g.dbl.transaction(transactionObjectStores, "readwrite").objectStore(objectStore);
    }

    /**
     * Add a new player to the database or update an existing player.
     * 
     * @memberOf db
     * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on players readwrite; if null is passed, then a new transaction will be used.
     * @param {Object} p Player object.
     * @param {function()} cb Optional callback.
     */
    function putPlayer(ot, p, cb) {
        var playerStore;

        playerStore = getObjectStore(ot, "players", "players");

        playerStore.put(p);

        if (typeof cb !== "undefined") {
            cb();
        }
    }

    /**
     * Get a filtered player object.
     *
     * For a player object (pa), create an object suitible for output based on the appropriate season and tid. attributes, stats, and ratings are lists of keys, and all those keys will appear flat in a single object IF ONLY ONE YEAR is requested. If tid is null, then any team is acceptable. If season is null, then a list of all seasons is returned for all ratings and stats, and tid is ignored.
     * 
     * This function is overcomplicated and convoluted.
     * 
     * @memberOf db
     * @param {Object} pa Player object.
     * @param {?number} season Season to retrieve stats/ratings for. If null, return stats/ratings for all seasons in a list.
     * @param {?number} tid Team ID to retrieve stats for. This is useful in the case where a player played for multiple teams in a season. Eventually, there should be some way to specify whether the stats for multiple teams in a single season should be merged together or not. For now, passing null just picks the first entry, which is clearly wrong.
     * @param {Array.<string>} attributes List of player attributes to include in output.
     * @param {Array.<string>} stats List of player stats to include in output.
     * @param {Array.<string>} ratings List of player ratings to include in output.
     * @param {Object} options Object containing various domain-specific options that are rarely used and should eventually be documented.
     * @return {Object} Filtered object containing the requested information for the player.
     */
    function getPlayer(pa, season, tid, attributes, stats, ratings, options) {
        var i, j, k, player, pr, ps, teams, tidTemp;

        options = typeof options !== "undefined" ? options : {};

        if (stats.length === 0) {
            options.showNoStats = true;
        }

        player = {};

        // Attributes
        for (j = 0; j < attributes.length; j++) {
            if (attributes[j] === "age") {
                player.age = g.season - pa.bornYear;
            } else if (attributes[j] === "hgtFt") {
                player.hgtFt = Math.floor(pa.hgt / 12);
            } else if (attributes[j] === "hgtIn") {
                player.hgtIn = pa.hgt - 12 * Math.floor(pa.hgt / 12);
            } else if (attributes[j] === "contractAmount") {
                player.contractAmount = pa.contractAmount / 1000;

            } else if (attributes[j] === "cashOwed") {
                player.cashOwed = ((1 + pa.contractExp - g.season) * pa.contractAmount - (1 - options.numGamesRemaining / 82) * pa.contractAmount) / 1000;
            } else if (attributes[j] === "abbrev") {
                player.abbrev = helpers.getAbbrev(pa.tid);
            } else if (attributes[j] === "teamRegion") {
                if (pa.tid >= 0) {
                    teams = helpers.getTeams();
                    player.teamRegion = teams[pa.tid].region;
                } else {
                    player.teamRegion = "";
                }
            } else if (attributes[j] === "teamName") {
                if (pa.tid >= 0) {
                    teams = helpers.getTeams();
                    player.teamName = teams[pa.tid].name;
                } else if (pa.tid === c.PLAYER_FREE_AGENT) {
                    player.teamName = "Free Agent";
                } else if (pa.tid === c.PLAYER_UNDRAFTED) {
                    player.teamName = "Draft Prospect";
                } else if (pa.tid === c.PLAYER_RETIRED) {
                    player.teamName = "Retired";
                }
            } else {
                player[attributes[j]] = pa[attributes[j]];
            }
        }

        // Ratings
        if (ratings.length > 0) {
            if (season !== null) {
                // One season
                for (j = 0; j < pa.ratings.length; j++) {
                    if (pa.ratings[j].season === season) {
                        pr = pa.ratings[j];
                        break;
                    }
                }
                for (j = 0; j < ratings.length; j++) {
                    player[ratings[j]] = pr[ratings[j]];
                }
            } else {
                // All seasons
                player.ratings = [];
                for (k = 0; k < pa.ratings.length; k++) {
                    player.ratings[k] = {};
                    for (j = 0; j < ratings.length; j++) {
                        if (ratings[j] === "age") {
                            player.ratings[k].age = pa.ratings[k].season - pa.bornYear;
                        } else if (ratings[j] === "abbrev") {
                            // Find the last stats entry for that season, and use that to determine the team
                            for (i = 0; i < pa.stats.length; i++) {
                                if (pa.stats[i].season === pa.ratings[k].season && pa.stats[i].playoffs === false) {
                                    tidTemp = pa.stats[i].tid;
                                }
                            }
                            if (tidTemp >= 0) {
                                player.ratings[k].abbrev = helpers.getAbbrev(tidTemp);
                                tidTemp = undefined;
                            }
                        } else {
                            player.ratings[k][ratings[j]] = pa.ratings[k][ratings[j]];
                        }
                    }
                }
            }
        }

        // Stats
        ps = undefined;
        if (stats.length > 0) {
            if (season !== null) {
                // Single season
                if (tid !== null) {
                    // Get stats for a single team
                    for (j = 0; j < pa.stats.length; j++) {
                        if (pa.stats[j].season === season && pa.stats[j].playoffs === false && pa.stats[j].tid === tid) {
                            ps = pa.stats[j];
                            break;
                        }
                    }
                } else {
                    // Get stats for all teams - eventually this should imply adding together multiple stats objects rather than just using the first
                    for (j = 0; j < pa.stats.length; j++) {
                        if (pa.stats[j].season === season && pa.stats[j].playoffs === false) {
                            ps = pa.stats[j];
                            break;
                        }
                    }
                }

                // Load previous season if no stats this year
                if (options.oldStats && typeof ps === "undefined") {
                    for (j = 0; j < pa.stats.length; j++) {
                        if (pa.stats[j].season === g.season - 1 && pa.stats[j].playoffs === false) {
                            ps = pa.stats[j];
                            break;
                        }
                    }
                }
            } else {
                // Multiple seasons
                ps = [];
                for (j = 0; j < pa.stats.length; j++) {
                    if (pa.stats[j].playoffs === false) {
                        ps.push(pa.stats[j]);
                    }
                }
            }
        }

        function filterStats(player, ps, stats) {
            var j;

            if (typeof ps !== "undefined" && ps.gp > 0) {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "gp") {
                        player.gp = ps.gp;
                    } else if (stats[j] === "gs") {
                        player.gs = ps.gs;
                    } else if (stats[j] === "fgp") {
                        if (ps.fga > 0) {
                            player.fgp = 100 * ps.fg / ps.fga;
                        } else {
                            player.fgp = 0;
                        }
                    } else if (stats[j] === "tpp") {
                        if (ps.tpa > 0) {
                            player.tpp = 100 * ps.tp / ps.tpa;
                        } else {
                            player.tpp = 0;
                        }
                    } else if (stats[j] === "ftp") {
                        if (ps.fta > 0) {
                            player.ftp = 100 * ps.ft / ps.fta;
                        } else {
                            player.ftp = 0;
                        }
                    } else if (stats[j] === "season") {
                        player.season = ps.season;
                    } else if (stats[j] === "age") {
                        player.age = ps.season - pa.bornYear;
                    } else if (stats[j] === "abbrev") {
                        player.abbrev = helpers.getAbbrev(ps.tid);
                    } else {
                        player[stats[j]] = ps[stats[j]] / ps.gp;
                    }
                }
            } else {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "season") {
                        player.season = ps.season;
                    } else if (stats[j] === "age") {
                        player.age = ps.season - pa.bornYear;
                    } else if (stats[j] === "abbrev") {
                        player.abbrev = helpers.getAbbrev(ps.tid);
                    } else {
                        player[stats[j]] = 0;
                    }
                }
            }

            return player;
        }

        // Only show a player if they have a stats entry for this team and season, or if they are rookies who have just been drafted and the current roster is being viewed.
        if ((options.showRookies && pa.draftYear === g.season && season === g.season) || typeof ps !== "undefined" || options.showNoStats) {
            if (typeof ps !== "undefined" && ps.length >= 0) {
                player.stats = [];
                // Multiple seasons
                for (i = 0; i < ps.length; i++) {
                    player.stats.push({});
                    player.stats[i] = filterStats(player.stats[i], ps[i], stats);
                }
            } else {
                // Single seasons
                player = filterStats(player, ps, stats);
            }
        } else {
            player = null;
        }

        return player;
    }

    /**
     * Get an array of filtered player objects.
     *
     * After the first argument, all subsequent arguments are passed on to db.getPlayer, where further documentation can also be found.
     * 
     * @memberOf db
     * @param {Array} playersAll Array of player objects.
     */
    function getPlayers(playersAll, season, tid, attributes, stats, ratings, options) {
        var i, player, players;

        options = typeof options !== "undefined" ? options : {};

        players = [];
        for (i = 0; i < playersAll.length; i++) {
            player = getPlayer(playersAll[i], season, tid, attributes, stats, ratings, options);
            if (player !== null) {
                players.push(player);
            }
        }

        if (options.sortBy === "rosterOrder") {
            players.sort(function (a, b) {  return a.rosterOrder - b.rosterOrder; });
        }

        return players;
    }

    function getTeam(ta, season, attributes, stats, seasonAttributes) {
        var i, j, team, ts, tsa;

        team = {};

        // Attributes
        for (j = 0; j < attributes.length; j++) {
            team[attributes[j]] = ta[attributes[j]];
        }

        // Season attributes
        if (seasonAttributes.length > 0) {
            for (j = 0; j < ta.seasons.length; j++) {
                if (ta.seasons[j].season === season) {
                    tsa = ta.seasons[j];
                    break;
                }
            }
            for (j = 0; j < seasonAttributes.length; j++) {
                if (seasonAttributes[j] === "winp") {
                    team.winp = 0;
                    if (tsa.won + tsa.lost > 0) {
                        team.winp = tsa.won / (tsa.won + tsa.lost);
                    }
                } else if (seasonAttributes[j] === "att") {
                    team.att = 0;
                    if (tsa.gp > 0) {
                        team.att = tsa.att / tsa.gp;
                    }
                } else if (seasonAttributes[j] === "revenue") {
                    team.revenue = tsa.att * g.ticketPrice / 1000000;
                } else if (seasonAttributes[j] === "profit") {
                    team.profit = (tsa.att * g.ticketPrice - tsa.cost) / 1000000;
                } else if (seasonAttributes[j] === "payroll") {
                    // Handled later
                } else {
                    team[seasonAttributes[j]] = tsa[seasonAttributes[j]];
                }
            }
        }

        // Team stats
        ts = undefined;
        if (stats.length > 0) {
            if (season !== null) {
                // Single season
                for (j = 0; j < ta.stats.length; j++) {
                    if (ta.stats[j].season === season && ta.stats[j].playoffs === false) {
                        ts = ta.stats[j];
                        break;
                    }
                }
            } else {
                // Multiple seasons
                ts = [];
                for (j = 0; j < ta.stats.length; j++) {
                    if (ta.stats[j].playoffs === false) {
                        ts.push(ta.stats[j]);
                    }
                }
            }
        }

        function filterStats(team, ts, stats) {
            var j;

            if (typeof ts !== "undefined" && ts.gp > 0) {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "gp") {
                        team.gp = ts.gp;
                    } else if (stats[j] === "fgp") {
                        if (ts.fga > 0) {
                            team.fgp = 100 * ts.fg / ts.fga;
                        } else {
                            team.fgp = 0;
                        }
                    } else if (stats[j] === "tpp") {
                        if (ts.tpa > 0) {
                            team.tpp = 100 * ts.tp / ts.tpa;
                        } else {
                            team.tpp = 0;
                        }
                    } else if (stats[j] === "ftp") {
                        if (ts.fta > 0) {
                            team.ftp = 100 * ts.ft / ts.fta;
                        } else {
                            team.ftp = 0;
                        }
                    } else if (stats[j] === "season") {
                        team.season = ts.season;
                    } else {
                        team[stats[j]] = ts[stats[j]] / ts.gp;
                    }
                }
            } else {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "season") {
                        team.season = ts.season;
                    } else {
                        team[stats[j]] = 0;
                    }
                }
            }

            return team;
        }

        if (typeof ts !== "undefined" && ts.length >= 0) {
            team.stats = [];
            // Multiple seasons
            for (i = 0; i < ts.length; i++) {
                team.stats.push({});
                team.stats[i] = filterStats(team.stats[i], ts[i], stats);
            }
        } else {
            // Single seasons
            team = filterStats(team, ts, stats);
        }

        return team;
    }

    /**
     * Get an array of filtered team objects.
     * 
     * @memberOf db
     * @param {(IDBTransaction|null)} ot An IndexedDB transaction on players, releasedPlayers, and teams; if null is passed, then a new transaction will be used.
     * @param {number} season Season to retrieve data for.
     * @param {Array.<string>} attributes List of non-seasonal attributes (such as team name) to include in output.
     * @param {Array.<string>} stats List of team stats to include in output.
     * @param {Array.<string>} seasonAttributes List of seasonal attributes (such as won or lost) to include in output.
     * @param {string|null} sortBy String represeting the sorting method. "winp" sorts by descending winning percentage, "winpAsc" does the opposite.
     * @param {function(Array)} cb Callback whose first argument is an array of all the team objects.
     */
    function getTeams(ot, season, attributes, stats, seasonAttributes, sortBy, cb) {
        var done, transaction;

        transaction = getObjectStore(ot, ["players", "releasedPlayers", "teams"], null);
        transaction.objectStore("teams").getAll().onsuccess = function (event) {
            var i, savePayrollCb, teams, teamsAll;

            teamsAll = event.target.result;
            teams = [];

            for (i = 0; i < teamsAll.length; i++) {
                teams.push(getTeam(teamsAll[i], season, attributes, stats, seasonAttributes));
            }

            if (sortBy === "winp") {
                // Sort by winning percentage, descending
                teams.sort(function (a, b) {  return b.winp - a.winp; });
            } else if (sortBy === "winpAsc") {
                // Sort by winning percentage, ascending
                teams.sort(function (a, b) {  return a.winp - b.winp; });
            }

            if (seasonAttributes.indexOf("payroll") < 0) {
                cb(teams);
            } else {
                savePayrollCb = function (i) {
                    return function (payroll) {
                        teams[i].payroll = payroll / 1000;
                        if (i === teams.length - 1) {
                            cb(teams);
                        }
                    };
                }
                for (i = 0; i < teams.length; i++) {
                    getPayroll(transaction, teams[i].tid, savePayrollCb(i));
                }
            }
        };
    }

    /**
     * Get the total payroll for a team.
     * 
     * This includes players who have been released but are still owed money from their old contracts.
     * 
     * @memberOf db
     * @param {IDBTransaction|null} ot An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
     * @param {number} tid Team ID.
     * @param {function(Array)} cb Callback whose first argument is the payroll in thousands of dollars.
     */
    function getPayroll(ot, tid, cb) {
        var payroll, transaction;

        transaction = getObjectStore(ot, ["players", "releasedPlayers"], null);
        transaction.objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
            var i, pa, playersAll;

            payroll = 0;
            playersAll = event.target.result;
            for (i = 0; i < playersAll.length; i++) {
                pa = playersAll[i];
                payroll += pa.contractAmount;
            }
        };
        transaction.objectStore("releasedPlayers").index("tid").getAll(tid).onsuccess = function (event) {
            var i, releasedPlayers;

            releasedPlayers = event.target.result;
            for (i = 0; i < releasedPlayers.length; i++) {
                payroll += releasedPlayers[i].contractAmount;
            }

            cb(parseInt(payroll, 10));
        };
    }

    /**
     * Sort a team's roster based on player ratings.
     * 
     * @memberOf db
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on players readwrite; if null is passed, then a new transaction will be used.
     * @param {number} tid Team ID.
     * @param {function()} cb Optional callback.
     */
    function rosterAutoSort(ot, tid, cb) {
        var players, playerStore;

        playerStore = getObjectStore(ot, "players", "players");

        // Get roster and sort by overall rating
        playerStore.index("tid").getAll(tid).onsuccess = function (event) {
            var i;

            players = getPlayers(event.target.result, g.season, tid, ["pid"], [], ["ovr"], {showNoStats: true, showRookies: true});
            players.sort(function (a, b) {  return b.ovr - a.ovr; });

            for (i = 0; i < players.length; i++) {
                players[i].rosterOrder = i;
            }
        }

        // Update rosterOrder
        playerStore.index("tid").openCursor(tid).onsuccess = function (event) {
            var cursor, i, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;
                for (i = 0; i < players.length; i++) {
                    if (players[i].pid === p.pid) {
                        p.rosterOrder = players[i].rosterOrder;
                        break;
                    }
                }
                cursor.update(p);
                cursor.continue();
            }
        }

        if (typeof cb !== "undefined") {
            cb();
        }
    }

    return {
        connect_meta: connect_meta,
        connect_league: connect_league,
        putPlayer: putPlayer,
        getPlayer: getPlayer,
        getPlayers: getPlayers,
        getTeam: getTeam,
        getTeams: getTeams,
        getPayroll: getPayroll,
        rosterAutoSort: rosterAutoSort
    };
});