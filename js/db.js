/**
 * @name db
 * @namespace Creating, migrating, and connecting to databases; working with transactions.
 */
define(["globals", "lib/davis", "lib/jquery", "lib/underscore", "util/helpers"], function (g, Davis, $, _, helpers) {
    "use strict";

    /**
     * Create new meta database with the latest structure.
     * 
     * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
     */
    function createMeta(event) {
        var dbm, leagueStore;
        console.log("Creating meta database");

        dbm = event.target.result;

        leagueStore = dbm.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
    }

    /**
     * Migrate meta database to the latest structure.
     * 
     * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
     * @param {number} lid Integer league ID number.
     */
    function migrateMeta(event, lid) {
        var dbm, migrateMessage, tx;

        console.log("Upgrading meta database from version " + event.oldVersion + " to version " + event.newVersion);

        migrateMessage = '';

        dbm = event.target.result;

        if (event.oldVersion <= 1) {
            dbm.deleteObjectStore("teams");

            migrateMessage += '<p><strong>New in version 3.0.0-beta.2:</strong> injuries, more refined economic/financial simulations, improved contract negotiations, noise in displayed player ratings dependent on your scouting budget, and annual interactions with the owner of the team including the possibility of being fired for poor performance.</p>';
        }

        $("#content").before('<div class="alert alert-info"><button type="button" class="close" data-dismiss="alert">&times;</button>' + migrateMessage + '</div>');
    }

    function connectMeta(cb) {
        var request;

//        console.log('Connecting to database "meta"');
        request = indexedDB.open("meta", 2);
        request.onerror = function (event) {
            throw new Error("Meta connection error");
        };
        request.onblocked = function () { g.dbm.close(); };
        request.onupgradeneeded = function (event) {
            if (event.oldVersion === 0) {
                createMeta(event);
            } else {
                migrateMeta(event);
            }
        };
        request.onsuccess = function (event) {
            g.dbm = request.result;
            g.dbm.onerror = function (event) {
                if (event.target.webkitErrorMessage) {
                    throw new Error("Meta database error: " + event.target.webkitErrorMessage);
                } else {
                    throw new Error("Meta database error: " + event.target.errorCode);
                }
            };
            cb();
        };
    }

    /**
     * Create a new league database with the latest structure.
     * 
     * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
     * @param {number} lid Integer league ID number for new league.
     */
    function createLeague(event, lid) {
        var awardsStore, dbl, draftOrderStore, gameAttributesStore, gameStore, messagesStore, playerStore, playoffSeriesStore, releasedPlayersStore, scheduleStore, teamStore, tradeStore;

        console.log("Creating league" + lid + " database");

        dbl = event.target.result;

        // rid ("row id") is used as the keyPath for objects without an innate unique identifier
        playerStore = dbl.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
        teamStore = dbl.createObjectStore("teams", {keyPath: "tid"});
        gameStore = dbl.createObjectStore("games", {keyPath: "gid"});
        scheduleStore = dbl.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
        playoffSeriesStore = dbl.createObjectStore("playoffSeries", {keyPath: "season"});
        releasedPlayersStore = dbl.createObjectStore("releasedPlayers", {keyPath: "rid", autoIncrement: true});
        awardsStore = dbl.createObjectStore("awards", {keyPath: "season"});
        tradeStore = dbl.createObjectStore("trade", {keyPath: "rid"});
        draftOrderStore = dbl.createObjectStore("draftOrder", {keyPath: "rid"});
        draftOrderStore = dbl.createObjectStore("negotiations", {keyPath: "pid"});
        gameAttributesStore = dbl.createObjectStore("gameAttributes", {keyPath: "key"});
        messagesStore = dbl.createObjectStore("messages", {keyPath: "mid", autoIncrement: true});

        playerStore.createIndex("tid", "tid", {unique: false});
        playerStore.createIndex("draft.year", "draft.year", {unique: false});
        playerStore.createIndex("retiredYear", "retiredYear", {unique: false});
        playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
//        gameStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used because currently the season index is used. If multiple indexes are eventually supported, then use this too.
        gameStore.createIndex("season", "season", {unique: false});
        releasedPlayersStore.createIndex("tid", "tid", {unique: false});
        releasedPlayersStore.createIndex("contract.exp", "contract.exp", {unique: false});
    }

    /**
     * Migrate a league database to the latest structure.
     * 
     * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
     * @param {number} lid Integer league ID number.
     */
    function migrateLeague(event, lid) {
        var dbl, teams, tx;

        console.log("Upgrading league" + lid + " database from version " + event.oldVersion + " to version " + event.newVersion);

        dbl = event.target.result;

        if (event.oldVersion <= 1) {
            teams = teams = helpers.getTeams();

            tx = event.currentTarget.transaction;

            tx.objectStore("gameAttributes").put({
                key: "ownerMood",
                value: {
                    wins: 0,
                    playoffs: 0,
                    money: 0
                }
            });
            tx.objectStore("gameAttributes").put({
                key: "gameOver",
                value: false
            });

            dbl.createObjectStore("messages", {keyPath: "mid", autoIncrement: true});

            tx.objectStore("negotiations").openCursor().onsuccess = function (event) {
                var cursor, n;

                cursor = event.target.result;
                if (cursor) {
                    n = cursor.value;

                    n.orig = {
                        amount: n.playerAmount,
                        years: n.playerYears
                    };
                    n.player = {
                        amount: n.playerAmount,
                        years: n.playerYears
                    };
                    delete n.playerAmount;
                    delete n.playerYears;

                    n.team = {
                        amount: n.teamAmount,
                        years: n.teamYears
                    };
                    delete n.teamAmount;
                    delete n.teamYears;

                    delete n.maxOffers;
                    delete n.numOffersMade;

                    cursor.update(n);

                    cursor.continue();
                }
            };

            tx.objectStore("players").openCursor().onsuccess = function (event) {
                var cursor, i, p;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;

                    p.born = {
                        loc: p.bornLoc,
                        year: p.bornYear
                    };
                    delete p.bornLoc;
                    delete p.bornYear;

                    p.contract = {
                        amount: p.contractAmount,
                        exp: p.contractExp
                    };
                    delete p.contractAmount;
                    delete p.contractExp;

                    p.draft = {
                        round: p.draftRound,
                        pick: p.draftPick,
                        tid: p.draftTid,
                        year: p.draftYear,
                        abbrev: p.draftAbbrev,
                        teamName: p.draftTeamName,
                        teamRegion: p.draftTeamRegion,
                        pot: p.ratings[0].pot,
                        ovr: p.ratings[0].ovr,
                        skills: p.ratings[0].skills
                    };
                    delete p.draftRound;
                    delete p.draftPick;
                    delete p.draftTid;
                    delete p.draftYear;
                    delete p.draftAbbrev;
                    delete p.draftTeamName;
                    delete p.draftTeamRegion;

                    p.freeAgentMood = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    delete p.freeAgentTimesAsked;

                    p.awards = [];
                    p.college = "";
                    p.injury = {type: "Healthy", gamesRemaining: 0};
                    p.salaries = [];

                    for (i = 0; i < p.ratings.length; i++) {
                        p.ratings[i].fuzz = 0;
                    }

                    cursor.update(p);

                    cursor.continue();
                }
            };
            tx.objectStore("players").deleteIndex("draftYear");
            tx.objectStore("players").createIndex("draft.year", "draft.year", {unique: false});

            tx.objectStore("releasedPlayers").openCursor().onsuccess = function (event) {
                var cursor, rp;

                cursor = event.target.result;
                if (cursor) {
                    rp = cursor.value;

                    rp.contract = {
                        amount: rp.contractAmount,
                        exp: rp.contractExp
                    };
                    delete rp.contractAmount;
                    delete rp.contractExp;

                    cursor.update(rp);

                    cursor.continue();
                }
            };
            tx.objectStore("releasedPlayers").deleteIndex("contractExp");
            tx.objectStore("releasedPlayers").createIndex("contract.exp", "contract.exp", {unique: false});

            tx.objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, i, t;

                cursor = event.target.result;
                if (cursor) {
                    t = cursor.value;

                    t.budget = {
                        ticketPrice: {
                            amount: helpers.round(25 + 25 * (30 - teams[t.tid].popRank) / 29, 2),
                            rank: teams[t.tid].popRank
                        },
                        scouting: {
                            amount: helpers.round(900 + 900 * (30 - teams[t.tid].popRank) / 29) * 10,
                            rank: teams[t.tid].popRank
                        },
                        coaching: {
                            amount: helpers.round(900 + 900 * (30 - teams[t.tid].popRank) / 29) * 10,
                            rank: teams[t.tid].popRank
                        },
                        health: {
                            amount: helpers.round(900 + 900 * (30 - teams[t.tid].popRank) / 29) * 10,
                            rank: teams[t.tid].popRank
                        },
                        facilities: {
                            amount: helpers.round(900 + 900 * (30 - teams[t.tid].popRank) / 29) * 10,
                            rank: teams[t.tid].popRank
                        }
                    };

                    for (i = 0; i < t.seasons.length; i++) {
                        t.seasons[i].hype = Math.random();
                        t.seasons[i].pop = teams[t.tid].pop;
                        t.seasons[i].tvContract = {
                            amount: 0,
                            exp: 0
                        };
                        t.seasons[i].revenues = {
                            merch: {
                                amount: 0,
                                rank: 15.5
                            },
                            sponsor: {
                                amount: 0,
                                rank: 15.5
                            },
                            ticket: {
                                amount: 0,
                                rank: 15.5
                            },
                            nationalTv: {
                                amount: 0,
                                rank: 15.5
                            },
                            localTv: {
                                amount: 0,
                                rank: 15.5
                            }
                        };
                        t.seasons[i].expenses = {
                            salary: {
                                amount: 0,
                                rank: 15.5
                            },
                            luxuryTax: {
                                amount: 0,
                                rank: 15.5
                            },
                            minTax: {
                                amount: 0,
                                rank: 15.5
                            },
                            buyOuts: {
                                amount: 0,
                                rank: 15.5
                            },
                            scouting: {
                                amount: 0,
                                rank: 15.5
                            },
                            coaching: {
                                amount: 0,
                                rank: 15.5
                            },
                            health: {
                                amount: 0,
                                rank: 15.5
                            },
                            facilities: {
                                amount: 0,
                                rank: 15.5
                            }
                        };
                        t.seasons[i].payrollEndOfSeason = 0;

                        t.seasons[i].playoffRoundsWon = -1;
                        if (t.seasons[i].madePlayoffs) {
                            t.seasons[i].playoffRoundsWon = 0;
                        }
                        if (t.seasons[i].confChamps) {
                            t.seasons[i].playoffRoundsWon = 3;
                        }
                        if (t.seasons[i].leagueChamps) {
                            t.seasons[i].playoffRoundsWon = 4;
                        }
                        delete t.seasons[i].madePlayoffs;
                        delete t.seasons[i].confChamps;
                        delete t.seasons[i].leagueChamps;

                        delete t.seasons[i].cost;
                        delete t.seasons[i].revenue;
                    }

                    cursor.update(t);

                    cursor.continue();
                }
            };
        }
    }

    function connectLeague(lid, cb) {
        var request;

//        console.log('Connecting to database "league' + lid + '"');
        request = indexedDB.open("league" + lid, 2);
        request.onerror = function (event) {
            throw new Error("League connection error");
        };
        request.onblocked = function () { g.dbl.close(); };
        request.onupgradeneeded = function (event) {
            if (event.oldVersion === 0) {
                createLeague(event, lid);
            } else {
                migrateLeague(event, lid);
            }
        };
        request.onsuccess = function (event) {
            g.dbl = request.result;
            g.dbl.onerror = function (event) {
//console.log(event);
                if (event.target.webkitErrorMessage) {
                    throw new Error("League database error: " + event.target.webkitErrorMessage);
                } else {
                    throw new Error("League database error: " + event.target.errorCode);
                }
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
        if (tid === undefined) {
            cb(0, []);
            return console.log('ERROR: db.getPayroll needs a TID!')
        }
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

    function reset() {
        var key;

        // localStorage, which is just use for table sorting currently
        for (key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                localStorage.removeItem(key);
            }
        }

        // Delete any current league databases
        console.log("Deleting any current league databases...");
        g.dbm.transaction("leagues").objectStore("leagues").getAll().onsuccess = function (event) {
            var data, done, i, league, leagues, request;

            leagues = event.target.result;

            if (leagues.length === 0) {
                console.log('No leagues found.');
                Davis.location.assign(new Davis.Request("/"));
            }

            league = require("core/league"); // Circular reference

            done = 0;
            for (i = 0; i < leagues.length; i++) {
                league.remove(i, function () {
                    done += 1;
                    if (done === leagues.length) {
                        // Delete any current meta database
                        console.log("Deleting any current meta database...");
                        g.dbm.close();
                        request = indexedDB.deleteDatabase("meta");
                        request.onsuccess = function (event) {
                            // Create new meta database
                            console.log("Creating new meta database...");
                            connectMeta(function () {
                                console.log("Done!");
                                Davis.location.assign(new Davis.Request("/"));
                            });
                        };
                    }
                });
            }
        };
    }

    return {
        connectMeta: connectMeta,
        connectLeague: connectLeague,
        getObjectStore: getObjectStore,
        getTeam: getTeam,
        getTeams: getTeams,
        getPayroll: getPayroll,
        getPayrolls: getPayrolls,
        loadGameAttribute: loadGameAttribute,
        loadGameAttributes: loadGameAttributes,
        setGameAttributes: setGameAttributes,
        reset: reset
    };
});