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
        var dbm;
        console.log("Creating meta database");

        dbm = event.target.result;

        dbm.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
        dbm.createObjectStore("achievements", {keyPath: "aid", autoIncrement: true});
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
        tx = event.currentTarget.transaction;

        if (event.oldVersion <= 1) {
            dbm.deleteObjectStore("teams");

            migrateMessage = '<p><strong>New in version 3.0.0-beta.2:</strong> injuries, more refined economic/financial simulations, improved contract negotiations, noise in displayed player ratings dependent on your scouting budget, and annual interactions with the owner of the team including the possibility of being fired for poor performance.</p>' + migrateMessage;
        }

        if (event.oldVersion <= 2) {
            migrateMessage = '<p><strong>New in version 3.0.0-beta.3:</strong> draft lottery, improved trading AI, revamped team history pages, and control over playing time from the roster page.</p>' + migrateMessage;
        }

        if (event.oldVersion <= 3) {
            migrateMessage = '<p><strong>New in version 3.0.0:</strong> export rosters for use in other leagues, import custom rosters, and view players selected to the Hall of Fame.</p>' + migrateMessage;
        }

        if (event.oldVersion <= 4) {
            migrateMessage = '<p><strong>New in version 3.1.0:</strong> better AI from opposing managers and more trade functionality, including trading draft picks and asking for counter-proposals from the team you\'re trading with.</p>' + migrateMessage;
        }

        if (event.oldVersion <= 5) {
            (function () {
                var teams;

                // Old team names
                teams = [
                    {region: "Atlanta", name: "Herons"},
                    {region: "Boston", name: "Clovers"},
                    {region: "Brooklyn", name: "Nests"},
                    {region: "Charlotte", name: "Bay Cats"},
                    {region: "Chicago", name: "Bullies"},
                    {region: "Cleveland", name: "Cobras"},
                    {region: "Dallas", name: "Mares"},
                    {region: "Denver", name: "Ninjas"},
                    {region: "Detroit", name: "Pumps"},
                    {region: "Golden State", name: "War Machine"},
                    {region: "Houston", name: "Rock Throwers"},
                    {region: "Indiana", name: "Passers"},
                    {region: "Los Angeles", name: "Cutters"},
                    {region: "Los Angeles", name: "Lagoons"},
                    {region: "Memphis", name: "Growls"},
                    {region: "Miami", name: "Heatwave"},
                    {region: "Milwaukee", name: "Buccaneers"},
                    {region: "Minnesota", name: "Trees"},
                    {region: "New Orleans", name: "Peloteros"},
                    {region: "New York", name: "Knights"},
                    {region: "Oklahoma City", name: "Tornados"},
                    {region: "Orlando", name: "Mystery"},
                    {region: "Philadelphia", name: "Steaks"},
                    {region: "Phoenix", name: "Stars"},
                    {region: "Portland", name: "Trailer Park"},
                    {region: "Sacramento", name: "Killers"},
                    {region: "San Antonio", name: "Spurts"},
                    {region: "Toronto", name: "Ravens"},
                    {region: "Utah", name: "Jugglers"},
                    {region: "Washington", name: "Witches"}
                ];

                tx.objectStore("leagues").openCursor().onsuccess = function (event) {
                    var cursor, l;

                    cursor = event.target.result;
                    if (cursor) {
                        l = cursor.value;
                        if (l.teamName === undefined) {
                            l.teamName = teams[l.tid].name;
                        }
                        if (l.teamRegion === undefined) {
                            l.teamRegion = teams[l.tid].region;
                        }
                        cursor.update(l);
                        cursor.continue();
                    }
                };

            }());
        }

        if (event.oldVersion <= 6) {
            (function () {
                dbm.createObjectStore("achievements", {keyPath: "aid", autoIncrement: true});
            }());
        }

        // This is no longer being used for update messages! See util/changes.js
        //$("#content").before('<div class="alert alert-info alert-top"><button type="button" class="close" data-dismiss="alert">&times;</button>' + migrateMessage + '</div>');
    }

    function connectMeta(cb) {
        var request;

//        console.log('Connecting to database "meta"');
        request = indexedDB.open("meta", 7);
        request.onerror = function (event) {
            throw new Error("Meta connection error");
        };
        request.onblocked = function () {
            alert("Please close all other tabs with this site open!");
        };
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
console.log(event);
                if (event.target.webkitErrorMessage) {
                    throw new Error("Meta database error: " + event.target.webkitErrorMessage);
                } else {
                    throw new Error("Meta database error: " + event.target.error.name + " - " + event.target.error.message);
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
        var dbl, draftPickStore, eventStore, gameStore, playerStatsStore, playerStore, releasedPlayerStore;

        console.log("Creating league" + lid + " database");

        dbl = event.target.result;

        // rid ("row id") is used as the keyPath for objects without an innate unique identifier
        playerStore = dbl.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
        playerStatsStore = dbl.createObjectStore("playerStats", {keyPath: "psid", autoIncrement: true});
        dbl.createObjectStore("teams", {keyPath: "tid"});
        gameStore = dbl.createObjectStore("games", {keyPath: "gid"});
        dbl.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
        dbl.createObjectStore("playoffSeries", {keyPath: "season"});
        releasedPlayerStore = dbl.createObjectStore("releasedPlayers", {keyPath: "rid", autoIncrement: true});
        dbl.createObjectStore("awards", {keyPath: "season"});
        dbl.createObjectStore("trade", {keyPath: "rid"});
        dbl.createObjectStore("draftOrder", {keyPath: "rid"});
        dbl.createObjectStore("negotiations", {keyPath: "pid"});
        dbl.createObjectStore("gameAttributes", {keyPath: "key"});
        dbl.createObjectStore("messages", {keyPath: "mid", autoIncrement: true});
        draftPickStore = dbl.createObjectStore("draftPicks", {keyPath: "dpid", autoIncrement: true});
        eventStore = dbl.createObjectStore("events", {keyPath: "eid", autoIncrement: true});

        playerStore.createIndex("tid", "tid", {unique: false});
        playerStore.createIndex("draft.year", "draft.year", {unique: false});
        playerStore.createIndex("retiredYear", "retiredYear", {unique: false});
        playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
        playerStatsStore.createIndex("pid, season, tid", ["pid", "season", "tid"], {unique: false}); // Would be unique if indexed on playoffs too, but that is a boolean and introduces complications... maybe worth fixing though?
//        gameStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used because currently the season index is used. If multiple indexes are eventually supported, then use this too.
        gameStore.createIndex("season", "season", {unique: false});
        releasedPlayerStore.createIndex("tid", "tid", {unique: false});
        releasedPlayerStore.createIndex("contract.exp", "contract.exp", {unique: false});
        draftPickStore.createIndex("season", "season", {unique: false});
        draftPickStore.createIndex("tid", "tid", {unique: false});
        eventStore.createIndex("season", "season", {unique: false});
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
        tx = event.currentTarget.transaction;

        // Make sure game attributes (i.e. g.startingSeason) are loaded first
        loadGameAttributes(event.currentTarget.transaction, function () {
            if (event.oldVersion <= 1) {
                teams = helpers.getTeamsDefault();

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
                                amount: helpers.round(25 + 25 * (g.numTeams - teams[t.tid].popRank) / (g.numTeams - 1), 2),
                                rank: teams[t.tid].popRank
                            },
                            scouting: {
                                amount: helpers.round(900 + 900 * (g.numTeams - teams[t.tid].popRank) / (g.numTeams - 1)) * 10,
                                rank: teams[t.tid].popRank
                            },
                            coaching: {
                                amount: helpers.round(900 + 900 * (g.numTeams - teams[t.tid].popRank) / (g.numTeams - 1)) * 10,
                                rank: teams[t.tid].popRank
                            },
                            health: {
                                amount: helpers.round(900 + 900 * (g.numTeams - teams[t.tid].popRank) / (g.numTeams - 1)) * 10,
                                rank: teams[t.tid].popRank
                            },
                            facilities: {
                                amount: helpers.round(900 + 900 * (g.numTeams - teams[t.tid].popRank) / (g.numTeams - 1)) * 10,
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

            if (event.oldVersion <= 2) {
                tx.objectStore("players").openCursor().onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    if (cursor) {
                        p = cursor.value;
                        p.ptModifier = 1;
                        cursor.update(p);
                        cursor.continue();
                    }
                };
            }

            if (event.oldVersion <= 3) {
                tx.objectStore("players").openCursor().onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    if (cursor) {
                        p = cursor.value;
                        if (p.tid === g.PLAYER.RETIRED && require("core/player").madeHof(p)) {
                            p.hof = true;
                            p.awards.push({season: g.season, type: "Inducted into the Hall of Fame"});
                        } else {
                            p.hof = false;
                        }
                        cursor.update(p);
                        cursor.continue();
                    }
                };
            }

            if (event.oldVersion <= 4) {
                tx.objectStore("teams").openCursor().onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    if (cursor) {
                        t = cursor.value;
                        t.strategy = "contending";
                        cursor.update(t);
                        cursor.continue();
                    }
                };

                tx.objectStore("trade").openCursor(0).onsuccess = function (event) {
                    var cursor, tr;

                    cursor = event.target.result;
                    tr = cursor.value;
                    tr.userDpids = [];
                    tr.otherDpids = [];
                    cursor.update(tr);
                };

                tx.objectStore("players").openCursor().onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    if (cursor) {
                        p = cursor.value;
                        p.draft.originalTid = p.draft.tid;
                        p.draft.originalAbbrev = p.draft.abbrev;
                        cursor.update(p);
                        cursor.continue();
                    }
                };

                (function () {
                    var draftPickStore, i, offset, round, t, teams;

                    draftPickStore = dbl.createObjectStore("draftPicks", {keyPath: "dpid", autoIncrement: true});
                    draftPickStore.createIndex("season", "season", {unique: false});
                    draftPickStore.createIndex("tid", "tid", {unique: false});

                    teams = helpers.getTeamsDefault();

                    if (g.phase >= g.PHASE.DRAFT) {
                        offset = 1;
                    } else {
                        offset = 0;
                    }

                    for (i = offset; i < 4 + offset; i++) {
                        for (t = 0; t < g.numTeams; t++) {
                            for (round = 1; round <= 2; round++) {
                                draftPickStore.add({
                                    tid: t,
                                    abbrev: teams[t].abbrev,
                                    originalTid: t,
                                    originalAbbrev: teams[t].abbrev,
                                    round: round,
                                    season: g.startingSeason + i
                                });
                            }
                        }
                    }
                }());
            }
            if (event.oldVersion <= 5) {
                tx.objectStore("players").openCursor().onsuccess = function (event) {
                    var cursor, i, p;

                    cursor = event.target.result;
                    if (cursor) {
                        p = cursor.value;

                        if (!p.hasOwnProperty("imgURL")) {
                            p.imgURL = "";
                        }

                        for (i = 0; i < p.stats.length; i++) {
                            if (!p.stats[i].hasOwnProperty("ewa")) {
                                p.stats[i].ewa = p.stats[i].min * (p.stats[i].per - 11) / 67 / 30 * 0.8;
                            }
                        }

                        cursor.update(p);
                        cursor.continue();
                    }
                };

                tx.objectStore("teams").getAll().onsuccess = function (event) {
                    var teams;

                    teams = event.target.result;

                    tx.objectStore("gameAttributes").put({
                        key: "teamAbbrevsCache",
                        value: _.pluck(teams, "abbrev")
                    });
                    tx.objectStore("gameAttributes").put({
                        key: "teamRegionsCache",
                        value: _.pluck(teams, "region")
                    });
                    tx.objectStore("gameAttributes").put({
                        key: "teamNamesCache",
                        value: _.pluck(teams, "name")
                    });
                };

                tx.objectStore("games").openCursor().onsuccess = function (event) {
                    var cursor, i, j, game, update;

                    cursor = event.target.result;
                    if (cursor) {
                        game = cursor.value;
                        update = false;

                        for (i = 0; i < game.teams.length; i++) {
                            // Fix ptsQtrs for old games where this wasn't stored
                            if (game.teams[i].ptsQtrs === undefined) {
                                game.teams[i].ptsQtrs = ["-", "-", "-", "-"];
                                for (j = 0; j < game.overtimes; j++) {
                                    game.teams[i].ptsQtrs.push("-");
                                }
                                update = true;
                            }
                        }

                        if (update) {
                            cursor.update(game);
                        }

                        cursor.continue();
                    }
                };
            }
            if (event.oldVersion <= 6) {
                tx.objectStore("trade").put({
                    rid: 0,
                    teams: [
                        {
                            tid: g.userTid,
                            pids: [],
                            dpids: []
                        },
                        {
                            tid: g.userTid === 0 ? 1 : 0,  // Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
                            pids: [],
                            dpids: []
                        }
                    ]
                });
            }
            if (event.oldVersion <= 7) {
                (function () {
                    var eventStore;

                    eventStore = dbl.createObjectStore("events", {keyPath: "eid", autoIncrement: true});
                    eventStore.createIndex("season", "season", {unique: false});
                }());
            }
            if (event.oldVersion <= 8) {
                (function () {
                    tx.objectStore("gameAttributes").put({
                        key: "gracePeriodEnd",
                        value: g.startingSeason + 2
                    });
                }());
            }
            if (event.oldVersion <= 9) {
                (function () {
                    var draft;

                    draft = require("core/draft");
                    draft.genPlayers(tx, g.PLAYER.UNDRAFTED_3, null, null, function () {
                        draft.genPlayers(tx, g.PLAYER.UNDRAFTED_2, null, null, function () {
                            tx.objectStore("players").index("tid").count(g.PLAYER.UNDRAFTED).onsuccess = function (event) {
                                if (event.target.result === 0) {
                                    draft.genPlayers(tx, g.PLAYER.UNDRAFTED, null, null, function () {});
                                }
                            };
                        });
                    });
                }());
            }
        });
    }

    function connectLeague(lid, cb) {
        var request;

//        console.log('Connecting to database "league' + lid + '"');
        request = indexedDB.open("league" + lid, 10);
        request.onerror = function (event) {
            throw new Error("League connection error");
        };
        request.onblocked = function () {
            alert("Please close all other tabs with this site open!");
        };
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
console.log(event);
                if (event.target.webkitErrorMessage) {
                    throw new Error("League database error: " + event.target.webkitErrorMessage);
                } else {
                    throw new Error("League database error: " + event.target.error.name + " - " + event.target.error.message);
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
                    watch: players[i].watch !== undefined ? players[i].watch : false, // undefined check is for old leagues, can delete eventually
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
                            if (player !== undefined) { // If a player is deleted, such as if the user deletes retired players to improve performance, this will be undefined
                                contracts.push({
                                    pid: releasedPlayers[i].pid,
                                    name: player.name,
                                    skills: _.last(player.ratings).skills,
                                    injury: player.injury,
                                    amount: releasedPlayers[i].contract.amount,
                                    exp: releasedPlayers[i].contract.exp,
                                    released: true
                                });
                            } else {
                                contracts.push({
                                    pid: releasedPlayers[i].pid,
                                    name: "Deleted Player",
                                    skills: [],
                                    amount: releasedPlayers[i].contract.amount,
                                    exp: releasedPlayers[i].contract.exp,
                                    released: true
                                });
                            }

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
     * Get the total current payroll for a team.
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
            return console.log('ERROR: db.getPayroll needs a TID!');
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
     * Get the total current payroll for every team team.
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
            if (event.target.result === undefined) {
                // Default values for old leagues - see also loadGameAttributes
                if (key === "numTeams") {
                    g.numTeams = 30;
                } else if (key === "godMode") {
                    g.godMode = false;
                } else if (key === "godModeInPast") {
                    g.godModeInPast = false;
                } else {
                    throw new Error("Unknown game attribute: " + key);
                }
            } else {
                g[key] = event.target.result.value;
            }

            // Make sure God Mode is correctly recognized for the UI - see also loadGameAttribute
            if (key === "godMode") {
                g.vm.topMenu.godMode(g.godMode);
            }

            if (cb !== undefined) {
                cb();
            }
        };
    }

    /**
     * Load game attributes from the database and update the global variable g.
     * 
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
     * @param {function()=} cb Optional callback.
     */
    function loadGameAttributes(ot, cb) {
        var gameAttributesStore;

        gameAttributesStore = getObjectStore(ot, "gameAttributes", "gameAttributes");

        gameAttributesStore.getAll().onsuccess = function (event) {
            var i, gameAttributes;

            gameAttributes = event.target.result;

            for (i = 0; i < gameAttributes.length; i++) {
                g[gameAttributes[i].key] = gameAttributes[i].value;
            }

            // Default values for old leagues - see also loadGameAttribute
            if (g.numTeams === undefined) {
                g.numTeams = 30;
            }
            if (g.godMode === undefined) {
                g.godMode = false;
            }
            if (g.godModeInPast === undefined) {
                g.godModeInPast = false;
            }

            // Make sure God Mode is correctly recognized for the UI - see also loadGameAttribute
            g.vm.topMenu.godMode(g.godMode);

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
                        $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStart");
                    } else {
                        $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStop");
                    }
                }
            }(key));
        }

        tx.oncomplete = function () {
            // Trigger signal for the team finances view again, or else sometimes it gets stuck. This is even more stupid.
            if (gameAttributes.hasOwnProperty("gamesInProgress") && gameAttributes.gamesInProgress) {
                $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStart");
            } else if (gameAttributes.hasOwnProperty("gamesInProgress") && !gameAttributes.gamesInProgress) {
                $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStop");
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
                league.remove(leagues[i].lid, function () {
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

    function updateMetaNameRegion(lid, name, region) {
        g.dbm.transaction("leagues", "readwrite").objectStore("leagues").openCursor(lid).onsuccess = function (event) {
            var cursor, l;

            cursor = event.target.result;
            if (cursor) {
                l = cursor.value;
                l.teamName = name;
                l.teamRegion = region;
                cursor.update(l);
            }
        };
    }

    return {
        connectMeta: connectMeta,
        connectLeague: connectLeague,
        getObjectStore: getObjectStore,
        getPayroll: getPayroll,
        getPayrolls: getPayrolls,
        loadGameAttribute: loadGameAttribute,
        loadGameAttributes: loadGameAttributes,
        setGameAttributes: setGameAttributes,
        reset: reset,
        updateMetaNameRegion: updateMetaNameRegion
    };
});