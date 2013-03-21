/**
 * @name db
 * @namespace Functions that directly access an IndexedDB database.
 */
define(["globals", "lib/jquery", "lib/underscore", "util/helpers"], function (g, $, _, helpers) {
    "use strict";

    function connectMeta(cb) {
        var request;

        console.log('Connecting to database "meta"');
        request = indexedDB.open("meta", 1);
        request.onerror = function (event) {
            console.log("Connection error");
        };
        request.onblocked = function () { g.dbm.close(); };
        request.onupgradeneeded = function (event) {
            var i, leagueStore, teams, teamStore;
            console.log("Upgrading meta database");

            g.dbm = event.target.result;

            leagueStore = g.dbm.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
        };
        request.onsuccess = function (event) {
            g.dbm = request.result;
            g.dbm.onerror = function (event) {
                console.log("Meta database error: " + event.target.errorCode);
            };
            cb();
        };
    }

    function connectLeague(lid, cb) {
        var request;

        console.log('Connecting to database "league' + lid + '"');
        request = indexedDB.open("league" + lid, 1);
        request.onerror = function (event) {
            console.log("Connection error");
        };
        request.onblocked = function () { g.dbl.close(); };
        request.onupgradeneeded = function (event) {
            var awardsStore, draftOrderStore, gameAttributesStore, gameStore, messagesStore, playerStore, playoffSeriesStore, releasedPlayersStore, scheduleStore, teamStore, tradeStore;

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
            draftOrderStore = g.dbl.createObjectStore("draftOrder", {keyPath: "rid"});
            draftOrderStore = g.dbl.createObjectStore("negotiations", {keyPath: "pid"});
            gameAttributesStore = g.dbl.createObjectStore("gameAttributes", {keyPath: "key"});
            messagesStore = g.dbl.createObjectStore("messages", {keyPath: "mid", autoIncrement: true});

            playerStore.createIndex("tid", "tid", {unique: false});
            playerStore.createIndex("draft.year", "draft.year", {unique: false});
            playerStore.createIndex("retiredYear", "retiredYear", {unique: false});
            playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
//            gameStore.createIndex("tid", "tid", {unique: false}); // Not used because it's useless without oppTid checking too
            gameStore.createIndex("season", "season", {unique: false});
            releasedPlayersStore.createIndex("tid", "tid", {unique: false});
            releasedPlayersStore.createIndex("contract.exp", "contract.exp", {unique: false});
        };
        request.onsuccess = function (event) {
            g.dbl = request.result;
            g.dbl.onerror = function (event) {
                console.log("League database error: " + event.target.errorCode);
            };
            cb();
        };
    }

    /**
     * Get an object store or transaction based on input which may be the desired object store, a transaction to be used, or null.
     * 
     * This allows for the convenient use of transactions or object stores that have already been defined, which is often necessary.
     * 
     * @memberOf db
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction to be used; if null is passed, then a new transaction will be used.
     * @param {(string|Array.<string>)} transactionObjectStores The object stores to open a transaction with, if necessary.
     * @param {?string} objectStore The object store to return. If null, return a transaction.
     * @param {boolean=} readwrite Should the transaction be readwrite or not? This only applies when a new transaction is created here (i.e. no transaction or objectStore is passed). Default false.
     * @return {(IDBObjectStore|IDBTransaction)} The requested object store or transaction.
     */
    function getObjectStore(ot, transactionObjectStores, objectStore, readwrite) {
        readwrite = readwrite !== undefined ? readwrite : false;

        if (ot instanceof IDBTransaction) {
            if (objectStore !== null) {
                return ot.objectStore(objectStore);
            }
            return ot; // Return original transaction
        }

        // Return a transaction
        if (objectStore === null) {
            if (ot instanceof IDBObjectStore) {
                return ot.transaction;
            }

            if (readwrite) {
                return g.dbl.transaction(transactionObjectStores, "readwrite");
            }
            return g.dbl.transaction(transactionObjectStores);
        }

        // ot is an objectStore already, and an objectStore was requested (not a transation)
        if (ot instanceof IDBObjectStore) {
            return ot;
        }


        if (readwrite) {
            return g.dbl.transaction(transactionObjectStores, "readwrite").objectStore(objectStore);
        }
        return g.dbl.transaction(transactionObjectStores).objectStore(objectStore);
    }

    /**
     * Add a new player to the database or update an existing player.
     *
     * There could be race conditions here if anything calling this relies on the player actually being added/updated in the database before the callback fires, as that is not guaranteed.
     * 
     * @memberOf db
     * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on players, readwrite; if null is passed, then a new transaction will be used.
     * @param {Object} p Player object.
     * @param {function()=} cb Optional callback.
     */
    function putPlayer(ot, p, cb) {
        var playerStore;

        playerStore = getObjectStore(ot, "players", "players");

        playerStore.put(p);

        if (cb !== undefined) {
            cb();
        }
    }

    /**
     * Get a filtered player object.
     *
     * For a player object (pa), create an object suitible for output based on the appropriate season and tid. attributes, stats, and ratings are lists of keys. In the output, the attributes keys will be in the root of the object. There will also be stats and ratings properties containing the filtered stats and ratings objects, if appropriate. If season is null, then the stats and ratings objects will contain lists of objects for each season and tid is ignored. Then, there will also be a careerStats property in the output object containing an object with career averages.
     * 
     * This function is overcomplicated and convoluted.
     * 
     * @memberOf db
     * @param {Object} pa Player object.
     * @param {?number} season Season to retrieve stats/ratings for. If null, return stats/ratings for all seasons in a list as well as career totals in player.careerStats.
     * @param {?number} tid Team ID to retrieve stats for. This is useful in the case where a player played for multiple teams in a season. Eventually, there should be some way to specify whether the stats for multiple teams in a single season should be merged together or not. For now, passing null just picks the first entry, which is clearly wrong.
     * @param {Array.<string>} attributes List of player attributes to include in output.
     * @param {Array.<string>} stats List of player stats to include in output.
     * @param {Array.<string>} ratings List of player ratings to include in output.
    * @param {Object} options Object containing various options. Possible keys include...  "totals": Boolean representing whether to return total stats (true) or per-game averages (false); default is false. "playoffs": Boolean representing whether to return playoff stats (statsPlayoffs and careerStatsPlayoffs) or not; default is false. "showNoStats": Boolean, when true players are returned with zeroed stats objects even if they have accumulated no stats for a team (such as newly drafted players, or players who were just traded for, etc.); this applies only for regular season stats. "fuzz": Boolean, when true noise is added to any returned ratings based on the fuzz variable for the given season (default: false); any user-facing rating should use true, any non-user-facing rating should use false. Other keys should eventually be documented.
     * @return {Object} Filtered object containing the requested information for the player.
     */
    function getPlayer(pa, season, tid, attributes, stats, ratings, options) {
        var i, j, k, key, ignoredKeys, player, pcs, pcsp, pr, ps, psp, teams, tidTemp;

        options = options !== undefined ? options : {};
        options.totals = options.totals !== undefined ? options.totals : false;
        options.playoffs = options.playoffs !== undefined ? options.playoffs : false;
        options.fuzz = options.fuzz !== undefined ? options.fuzz : false;

        if (stats.length === 0) {
            options.showNoStats = true;
        }

        player = {};

        // Attributes
        for (j = 0; j < attributes.length; j++) {
            if (attributes[j] === "age") {
                player.age = g.season - pa.born.year;
            } else if (attributes[j] === "draft") {
                player.draft = pa.draft;
                player.draft.age = pa.draft.year - pa.born.year;
                if (options.fuzz) {
                    player.draft.ovr =  Math.round(helpers.bound(player.draft.ovr + pa.ratings[0].fuzz, 0, 100));
                    player.draft.pot =  Math.round(helpers.bound(player.draft.pot + pa.ratings[0].fuzz, 0, 100));
                }
            } else if (attributes[j] === "hgtFt") {
                player.hgtFt = Math.floor(pa.hgt / 12);
            } else if (attributes[j] === "hgtIn") {
                player.hgtIn = pa.hgt - 12 * Math.floor(pa.hgt / 12);
            } else if (attributes[j] === "contract") {
                player.contract = helpers.deepCopy(pa.contract);  // [millions of dollars]
                player.contract.amount = player.contract.amount / 1000;  // [millions of dollars]
            } else if (attributes[j] === "cashOwed") {
                player.cashOwed = ((1 + pa.contract.exp - g.season) * pa.contract.amount - (1 - options.numGamesRemaining / 82) * pa.contract.amount) / 1000;  // [millions of dollars]
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
                } else if (pa.tid === g.PLAYER.FREE_AGENT) {
                    player.teamName = "Free Agent";
                } else if (pa.tid === g.PLAYER.UNDRAFTED) {
                    player.teamName = "Draft Prospect";
                } else if (pa.tid === g.PLAYER.RETIRED) {
                    player.teamName = "Retired";
                }
            } else if (attributes[j] === "injury" && season !== null && season < g.season) {
                player.injury = {type: "Healthy", gamesRemaining: 0};
            } else if (attributes[j] === "salaries") {
                player.salaries = _.map(pa.salaries, function (salary) { salary.amount /= 1000; return salary; });
            } else if (attributes[j] === "salariesTotal") {
                player.salariesTotal = _.reduce(player.salaries, function (memo, salary) { return memo + salary.amount; }, 0);
            } else {
                player[attributes[j]] = pa[attributes[j]];
            }
        }

        // Ratings
        if (ratings.length > 0) {
            if (season !== null) {
                // One season
                pr = null;
                for (j = 0; j < pa.ratings.length; j++) {
                    if (pa.ratings[j].season === season) {
                        pr = pa.ratings[j];
                        break;
                    }
                }
                if (pr === null) {
                    // Must be retired, or not in the league yet
                    return null;
                }

                player.ratings = {};
                for (j = 0; j < ratings.length; j++) {
                    player.ratings[ratings[j]] = pr[ratings[j]];
                    if (options.fuzz && ratings[j] !== "fuzz" && ratings[j] !== "season" && ratings[j] !== "skills") {
                        player.ratings[ratings[j]] = Math.round(helpers.bound(player.ratings[ratings[j]] + pr.fuzz, 0, 100));
                    }
                }
            } else {
                // All seasons
                player.ratings = [];
                for (k = 0; k < pa.ratings.length; k++) {
                    player.ratings[k] = {};
                    for (j = 0; j < ratings.length; j++) {
                        if (ratings[j] === "age") {
                            player.ratings[k].age = pa.ratings[k].season - pa.born.year;
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
                            if (options.fuzz && ratings[j] !== "fuzz" && ratings[j] !== "season" && ratings[j] !== "skills") {
                                player.ratings[k][ratings[j]] = Math.round(helpers.bound(player.ratings[k][ratings[j]] + pa.ratings[k].fuzz, 0, 100));
                            }
                        }
                    }
                }
            }
        }

        // Stats
        if (stats.length > 0) {
            if (season !== null) {
                ps = {};  // Regular season
                psp = {};  // Playoffs
                // Single season
                if (tid !== null) {
                    // Get stats for a single team
                    for (j = 0; j < pa.stats.length; j++) {
                        if (pa.stats[j].season === season && pa.stats[j].playoffs === false && pa.stats[j].tid === tid) {
                            ps = pa.stats[j];
                        }
                        if (options.playoffs && pa.stats[j].season === season && pa.stats[j].playoffs === true && pa.stats[j].tid === tid) {
                            psp = pa.stats[j];
                        }
                    }
                } else {
                    // Get stats for all teams - eventually this should imply adding together multiple stats objects rather than just using the first
                    for (j = 0; j < pa.stats.length; j++) {
                        if (pa.stats[j].season === season && pa.stats[j].playoffs === false) {
                            ps = pa.stats[j];
                        }
                        if (options.playoffs && pa.stats[j].season === season && pa.stats[j].playoffs === true) {
                            psp = pa.stats[j];
                        }
                    }
                }

                // Load previous season if no stats this year
                if (options.oldStats && _.isEmpty(ps)) {
                    for (j = 0; j < pa.stats.length; j++) {
                        if (pa.stats[j].season === g.season - 1 && pa.stats[j].playoffs === false) {
                            ps = pa.stats[j];
                        }
                        if (options.playoffs && pa.stats[j].season === g.season - 1 && pa.stats[j].playoffs === true) {
                            psp = pa.stats[j];
                        }
                    }
                }
            } else {
                // Multiple seasons
                ps = [];  // Regular season
                psp = [];  // Playoffs
                for (j = 0; j < pa.stats.length; j++) {
                    if (pa.stats[j].playoffs === false) {
                        ps.push(pa.stats[j]);
                    } else if (options.playoffs) {
                        psp.push(pa.stats[j]);
                    }
                }
                // Career totals
                pcs = {};  // Regular season
                pcsp = {};  // Playoffs
                if (ps.length > 0) {
                    // Either aggregate stats or ignore annual crap
                    ignoredKeys = ["age", "playoffs", "season", "tid"];
                    for (key in ps[0]) {
                        if (ps[0].hasOwnProperty(key)) {
                            if (ignoredKeys.indexOf(key) < 0) {
                                pcs[key] = _.reduce(_.pluck(ps, key), function (memo, num) { return memo + num; }, 0);
                                if (options.playoffs) {
                                    pcsp[key] = _.reduce(_.pluck(psp, key), function (memo, num) { return memo + num; }, 0);
                                }
                            }
                        }
                    }
                }
            }
        }

        function filterStats(player, ps, stats) {
            var j;

            if (!_.isEmpty(ps) && ps.gp > 0) {
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
                    } else if (stats[j] === "fgpAtRim") {
                        if (ps.fgaAtRim > 0) {
                            player.fgpAtRim = 100 * ps.fgAtRim / ps.fgaAtRim;
                        } else {
                            player.fgpAtRim = 0;
                        }
                    } else if (stats[j] === "fgpLowPost") {
                        if (ps.fgaLowPost > 0) {
                            player.fgpLowPost = 100 * ps.fgLowPost / ps.fgaLowPost;
                        } else {
                            player.fgpLowPost = 0;
                        }
                    } else if (stats[j] === "fgpMidRange") {
                        if (ps.fgaMidRange > 0) {
                            player.fgpMidRange = 100 * ps.fgMidRange / ps.fgaMidRange;
                        } else {
                            player.fgpMidRange = 0;
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
                        player.age = ps.season - pa.born.year;
                    } else if (stats[j] === "abbrev") {
                        player.abbrev = helpers.getAbbrev(ps.tid);
                    } else if (stats[j] === "per") {
                        player.per = ps.per;
                    } else {
                        if (options.totals) {
                            player[stats[j]] = ps[stats[j]];
                        } else {
                            player[stats[j]] = ps[stats[j]] / ps.gp;
                        }
                    }
                }
            } else {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "season") {
                        player.season = ps.season;
                    } else if (stats[j] === "age") {
                        player.age = ps.season - pa.born.year;
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
        if ((options.showRookies && pa.draft.year === g.season && season === g.season) || !_.isEmpty(ps) || options.showNoStats) {
            if (season === null) {
                // Multiple seasons
                player.stats = [];
                for (i = 0; i < ps.length; i++) {
                    player.stats.push(filterStats({}, ps[i], stats));
                }
                if (options.playoffs) {
                    player.statsPlayoffs = [];
                    for (i = 0; i < psp.length; i++) {
                        player.statsPlayoffs.push(filterStats({}, psp[i], stats));
                    }
                }
                // Career totals
                player.careerStats = filterStats({}, pcs, stats);
                player.careerStats.per = _.reduce(ps, function (memo, ps) { return memo + ps.per * ps.min; }, 0) / (player.careerStats.min * player.careerStats.gp); // Special case for PER - weight by minutes per season
                if (isNaN(player.careerStats.per)) { player.careerStats.per = 0; }
                if (options.playoffs) {
                    player.careerStatsPlayoffs = filterStats({}, pcsp, stats);
                    player.careerStatsPlayoffs.per = _.reduce(psp, function (memo, psp) { return memo + psp.per * psp.min; }, 0) / (player.careerStatsPlayoffs.min * player.careerStatsPlayoffs.gp); // Special case for PER - weight by minutes per season
                    if (isNaN(player.careerStatsPlayoffs.per)) { player.careerStatsPlayoffs.per = 0; }
                }
            } else {
                // Single seasons
                player.stats = filterStats({}, ps, stats);
                if (options.playoffs) {
                    if (!_.isEmpty(psp)) {
                        player.statsPlayoffs = filterStats({}, psp, stats);
                    } else {
                        player.statsPlayoffs = {};
                    }
                }
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

        options = options !== undefined ? options : {};

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

    /**
     * Gets all the contracts a team owes.
     * 
     * This includes contracts for players who have been released but are still owed money.
     * 
     * @memberOf db
     * @param {IDBTransaction|null} ot An IndexedDB transaction on players and releasedPlayers; if null is passed, then a new transaction will be used.
     * @param {number} tid Team ID.
     * @param {function(Array)} cb Callback whose first argument is an array of objects containing contract information.
     */
    function getContracts(ot, tid, cb) {
        var contracts, transaction;

        transaction = getObjectStore(ot, ["players", "releasedPlayers"], null);

        // First, get players currently on the roster
        transaction.objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
            var i, players;

            contracts = [];
            players = event.target.result;
            for (i = 0; i < players.length; i++) {
                contracts.push({
                    pid: players[i].pid,
                    name: players[i].name,
                    skills: _.last(players[i].ratings).skills,
                    injury: players[i].injury,
                    amount: players[i].contract.amount,
                    exp: players[i].contract.exp,
                    released: false
                });
            }

            // Then, get any released players still owed money
            transaction.objectStore("releasedPlayers").index("tid").getAll(tid).onsuccess = function (event) {
                var i, releasedPlayers;

                releasedPlayers = event.target.result;

                if (releasedPlayers.length === 0) {
                    return cb(contracts);
                }

                for (i = 0; i < releasedPlayers.length; i++) {
                    (function (i) {
                        transaction.objectStore("players").get(releasedPlayers[i].pid).onsuccess = function (event) {
                            var player;

                            player = event.target.result;
                            contracts.push({
                                pid: player.pid,
                                name: player.name,
                                skills: _.last(player.ratings).skills,
                                injury: player.injury,
                                amount: releasedPlayers[i].contract.amount,
                                exp: releasedPlayers[i].contract.exp,
                                released: true
                            });

                            if (contracts.length === players.length + releasedPlayers.length) {
                                cb(contracts);
                            }
                        };
                    }(i));
                }
            };
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
     * @param {function(number, Array=)} cb Callback; first argument is the payroll in thousands of dollars, second argument is the list of contract objects from getContracts.
     */
    function getPayroll(ot, tid, cb) {
        getContracts(ot, tid, function (contracts) {
            var i, payroll;

            payroll = 0;
            for (i = 0; i < contracts.length; i++) {
                payroll += contracts[i].amount;  // No need to check exp, since anyone without a contract for the current season will not have an entry
            }

            cb(payroll, contracts);
        });
    }

    /**
     * Get the total payroll for every team team.
     * 
     * @memberOf db
     * @param {function(Array.<number>)} cb Callback whose first argument is an array of payrolls, ordered by team id.
     */
    function getPayrolls(cb) {
        var i, localGetPayroll, payrolls, tx;

        payrolls = [];
        localGetPayroll = function (tx, tid) {
            getPayroll(tx, tid, function (payroll) {
                payrolls[tid] = payroll;
            });
        };

        // First, get all the current payrolls
        tx = g.dbl.transaction(["players", "releasedPlayers"]);
        for (i = 0; i < g.numTeams; i++) {
            localGetPayroll(tx, i);
        }
        tx.oncomplete = function () {
            cb(payrolls);
        };
    }

    /**
     * Get a filtered team object.
     *
     * See db.getTeams for documentation.
     * 
     * @memberOf db
     */
    function getTeam(ta, season, attributes, stats, seasonAttributes, options, cb) {
        var i, j, lastTenLost, lastTenWon, team, ts, tsa;

        options.playoffs = options.playoffs !== undefined ? options.playoffs : false;

        team = {};

        // Attributes
        for (j = 0; j < attributes.length; j++) {
            if (attributes[j] === "budget") {
                team.budget = helpers.deepCopy(ta.budget);
                _.each(team.budget, function (value, key) {
                    if (key !== "ticketPrice") {  // ticketPrice is the only thing in dollars always
                        value.amount /= 1000;
                    }
                });
            } else {
                team[attributes[j]] = ta[attributes[j]];
            }
        }

        // Season attributes
        if (seasonAttributes.length > 0) {
            for (j = 0; j < ta.seasons.length; j++) {
                if (ta.seasons[j].season === season) {
                    tsa = ta.seasons[j];
                    break;
                }
            }

            // Revenue and expenses calculation
            tsa.revenue = _.reduce(tsa.revenues, function (memo, revenue) { return memo + revenue.amount; }, 0);
            tsa.expense = _.reduce(tsa.expenses, function (memo, expense) { return memo + expense.amount; }, 0);

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
                    team.revenue = tsa.revenue / 1000;  // [millions of dollars]
                } else if (seasonAttributes[j] === "profit") {
                    team.profit = (tsa.revenue - tsa.expense) / 1000;  // [millions of dollars]
                } else if (seasonAttributes[j] === "salaryPaid") {
                    team.salaryPaid = tsa.expenses.salary.amount / 1000;  // [millions of dollars]
                } else if (seasonAttributes[j] === "payroll") {
                    // Handled later
                    team.payroll = null;
                } else if (seasonAttributes[j] === "lastTen") {
                    lastTenWon = _.reduce(tsa.lastTen, function (memo, num) { return memo + num; }, 0);
                    lastTenLost = tsa.lastTen.length - lastTenWon;
                    team.lastTen = lastTenWon + "-" + lastTenLost;
                } else if (seasonAttributes[j] === "streak") {  // For standings
                    if (tsa.streak === 0) {
                        team.streak = "None";
                    } else if (tsa.streak > 0) {
                        team.streak = "Won " + tsa.streak;
                    } else if (tsa.streak < 0) {
                        team.streak = "Lost " + Math.abs(tsa.streak);
                    }
                } else if (seasonAttributes[j] === "streakLong") {  // For dashboard
                    if (tsa.streak === 0) {
                        team.streakLong = null;
                    } else if (tsa.streak === 1) {
                        team.streakLong = "won last game";
                    } else if (tsa.streak > 1) {
                        team.streakLong = "won last " + tsa.streak + " games";
                    } else if (tsa.streak === -1) {
                        team.streakLong = "lost last game";
                    } else if (tsa.streak < -1) {
                        team.streakLong = "lost last " + Math.abs(tsa.streak) + " games";
                    }
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
                    if (ta.stats[j].season === season && ta.stats[j].playoffs === options.playoffs) {
                        ts = ta.stats[j];
                        break;
                    }
                }
            } else {
                // Multiple seasons
                ts = [];
                for (j = 0; j < ta.stats.length; j++) {
                    if (ta.stats[j].playoffs === options.playoffs) {
                        ts.push(ta.stats[j]);
                    }
                }
            }
        }

        function filterStats(team, ts, stats) {
            var j;

            if (ts !== undefined && ts.gp > 0) {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "gp") {
                        team.gp = ts.gp;
                    } else if (stats[j] === "fgp") {
                        if (ts.fga > 0) {
                            team.fgp = 100 * ts.fg / ts.fga;
                        } else {
                            team.fgp = 0;
                        }
                    } else if (stats[j] === "fgpAtRim") {
                        if (ts.fgaAtRim > 0) {
                            team.fgpAtRim = 100 * ts.fgAtRim / ts.fgaAtRim;
                        } else {
                            team.fgpAtRim = 0;
                        }
                    } else if (stats[j] === "fgpLowPost") {
                        if (ts.fgaLowPost > 0) {
                            team.fgpLowPost = 100 * ts.fgLowPost / ts.fgaLowPost;
                        } else {
                            team.fgpLowPost = 0;
                        }
                    } else if (stats[j] === "fgpMidRange") {
                        if (ts.fgaMidRange > 0) {
                            team.fgpMidRange = 100 * ts.fgMidRange / ts.fgaMidRange;
                        } else {
                            team.fgpMidRange = 0;
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
                        if (options.totals) {
                            team[stats[j]] = ts[stats[j]];
                        } else {
                            team[stats[j]] = ts[stats[j]] / ts.gp;
                        }
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

        if (ts !== undefined && ts.length >= 0) {
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

        if (cb !== undefined) {
            cb(team);
        } else {
            return team;
        }
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
     * @param {Object} options Object containing various options. Possible keys include... "sortBy": String represeting the sorting method; "winp" sorts by descending winning percentage, "winpAsc" does the opposite, default is sort by team ID. "totals": Boolean representing whether to return total stats (true) or per-game averages (false); default is false. "playoffs": Boolean that, when true, replaces the resturned stats with playoff stats (it doesn't return both like db.getPlayer).
     * @param {string|null} sortBy String represeting the sorting method. "winp" sorts by descending winning percentage, "winpAsc" does the opposite.
     * @param {function(Array)} cb Callback whose first argument is an array of all the team objects.
     */
    function getTeams(ot, season, attributes, stats, seasonAttributes, options, cb) {
        var done, transaction;

        options = options !== undefined ? options : {};
        if (!options.hasOwnProperty("totals")) {
            options.totals = false;
        }

        transaction = getObjectStore(ot, ["players", "releasedPlayers", "teams"], null);
        transaction.objectStore("teams").getAll().onsuccess = function (event) {
            var i, savePayroll, teams, teamsAll;

            teamsAll = event.target.result;
            teams = [];

            for (i = 0; i < teamsAll.length; i++) {
                teams.push(getTeam(teamsAll[i], season, attributes, stats, seasonAttributes, options));
            }

            if (options.hasOwnProperty("sortBy")) {
                if (options.sortBy === "winp") {
                    // Sort by winning percentage, descending
                    teams.sort(function (a, b) {  return b.winp - a.winp; });
                } else if (options.sortBy === "winpAsc") {
                    // Sort by winning percentage, ascending
                    teams.sort(function (a, b) {  return a.winp - b.winp; });
                }
            }

            // If payroll for the current season was requested, find the current payroll for each team. Otherwise, don't.
            if (seasonAttributes.indexOf("payroll") < 0 || season !== g.season) {
                cb(teams);
            } else {
                savePayroll = function (i) {
                    getPayroll(transaction, teams[i].tid, function (payroll) {
                        teams[i].payroll = payroll / 1000;
                        if (i === teams.length - 1) {
                            cb(teams);
                        } else {
                            savePayroll(i + 1);
                        }
                    });
                };
                savePayroll(0);
            }
        };
    }

    /**
     * Sort a team's roster based on player ratings.
     *
     * If ot is null, then the callback will run only after the transaction finishes (i.e. only after the updated roster order is actually saved to the database). If ot is not null, then the callback might run earlier, so don't rely on the updated roster order actually being in the database yet.
     *
     * So, ot should NOT be null if you're sorting multiple roster as a component of some larger operation, but the results of the sorts don't actually matter. ot should be null if you need to ensure that the roster order is updated before you do something that will read the roster order (like updating the UI).
     * 
     * @memberOf db
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on players readwrite; if null is passed, then a new transaction will be used.
     * @param {number} tid Team ID.
     * @param {function()=} cb Optional callback.
     */
    function rosterAutoSort(ot, tid, cb) {
        var players, playerStore, tx;

        tx = getObjectStore(ot, "players", null, true);
        playerStore = tx.objectStore("players");

        // Get roster and sort by overall rating
        playerStore.index("tid").getAll(tid).onsuccess = function (event) {
            var i;

            players = getPlayers(event.target.result, g.season, tid, ["pid"], [], ["ovr"], {showNoStats: true, showRookies: true, fuzz: tid === g.userTid});
            players.sort(function (a, b) {  return b.ratings.ovr - a.ratings.ovr; });

            for (i = 0; i < players.length; i++) {
                players[i].rosterOrder = i;
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
            };

            if (ot !== null) {
                // This function doesn't have its own transaction, so we need to call the callback now even though the update might not have been processed yet.
                if (cb !== undefined) {
                    cb();
                }
            }
        };

        if (ot === null) {
            // This function has its own transaction, so wait until it finishes before calling the callback.
            tx.oncomplete = function () {
                if (cb !== undefined) {
                    cb();
                }
            };
        }
    }

    function getDraftOrder(cb) {
        g.dbl.transaction("draftOrder").objectStore("draftOrder").get(0).onsuccess = function (event) {
            var draftOrder;

            draftOrder = event.target.result.draftOrder;
            cb(draftOrder);
        };
    }

    function setDraftOrder(draftOrder, cb) {
        var tx;

        tx = g.dbl.transaction("draftOrder", "readwrite");
        tx.objectStore("draftOrder").put({
            rid: 0,
            draftOrder: draftOrder
        });
        tx.oncomplete = function () {
            if (cb !== undefined) {
                cb();
            }
        };
    }

    /**
     * Load a game attribute from the database and update the global variable g.
     *
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
     * @param {string} key Key in gameAttributes to load the value for.
     * @param {function()=} cb Optional callback.
     */
    function loadGameAttribute(ot, key, cb) {
        var gameAttributesStore;

        gameAttributesStore = getObjectStore(ot, "gameAttributes", "gameAttributes");

        gameAttributesStore.get(key).onsuccess = function (event) {
            g[key] = event.target.result.value;

            if (cb !== undefined) {
                cb();
            }
        };
    }

    /**
     * Load game attributes from the database and update the global variable g.
     * 
     * @param {function()=} cb Optional callback.
     */
    function loadGameAttributes(cb) {
        g.dbl.transaction("gameAttributes").objectStore("gameAttributes").getAll().onsuccess = function (event) {
            var i, gameAttributes;

            gameAttributes = event.target.result;

            for (i = 0; i < gameAttributes.length; i++) {
                g[gameAttributes[i].key] = gameAttributes[i].value;
            }

            if (cb !== undefined) {
                cb();
            }
        };
    }

    /**
     * Set values in the gameAttributes objectStore and update the global variable g.
     *
     * Items stored in gameAttributes are globally available through the global variable g. If a value is a constant across all leagues/games/whatever, it should just be set in globals.js instead.
     * 
     * @param {Object} gameAttributes Each property in the object will be inserted/updated in the database with the key of the object representing the key in the database.
     * @param {function()=} cb Optional callback.
     */
    function setGameAttributes(gameAttributes, cb) {
        var gameAttributesStore, i, key, toUpdate, tx;

        toUpdate = [];
        for (key in gameAttributes) {
            if (gameAttributes.hasOwnProperty(key)) {
                if (g[key] !== gameAttributes[key]) {
                    toUpdate.push(key);
                }
            }
        }

        tx = g.dbl.transaction("gameAttributes", "readwrite");
        gameAttributesStore = tx.objectStore("gameAttributes");

        for (i = 0; i < toUpdate.length; i++) {
            key = toUpdate[i];
            (function (key) {
                gameAttributesStore.put({key: key, value: gameAttributes[key]}).onsuccess = function (event) {
                    g[key] = gameAttributes[key];
                };

                // Trigger a signal for the team finances view. This is stupid.
                if (key === "gamesInProgress") {
                    if (gameAttributes[key]) {
                        $("#finances-settings").trigger("gameSimulationStart");
                    } else {
                        $("#finances-settings").trigger("gameSimulationStop");
                    }
                }
            }(key));
        }

        tx.oncomplete = function () {
            // Trigger signal for the team finances view again, or else sometimes it gets stuck. This is even more stupid.
            if (gameAttributes.hasOwnProperty("gamesInProgress") && gameAttributes.gamesInProgress) {
                $("#finances-settings").trigger("gameSimulationStart");
            } else if (gameAttributes.hasOwnProperty("gamesInProgress") && !gameAttributes.gamesInProgress) {
                $("#finances-settings").trigger("gameSimulationStop");
            }

            if (cb !== undefined) {
                cb();
            }
        };
    }

    return {
        connectMeta: connectMeta,
        connectLeague: connectLeague,
        getObjectStore: getObjectStore,
        putPlayer: putPlayer,
        getPlayer: getPlayer,
        getPlayers: getPlayers,
        getTeam: getTeam,
        getTeams: getTeams,
        getPayroll: getPayroll,
        getPayrolls: getPayrolls,
        rosterAutoSort: rosterAutoSort,
        getDraftOrder: getDraftOrder,
        setDraftOrder: setDraftOrder,
        loadGameAttribute: loadGameAttribute,
        loadGameAttributes: loadGameAttributes,
        setGameAttributes: setGameAttributes
    };
});