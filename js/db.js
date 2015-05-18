/**
 * @name db
 * @namespace Creating, migrating, and connecting to databases; working with transactions.
 */
define(["dao", "globals", "lib/bluebird", "lib/davis", "lib/underscore", "util/eventLog", "util/helpers"], function (dao, g, Promise, Davis, _, eventLog, helpers) {
    "use strict";

    var migrateMessage = '<h1>Upgrading...</h1><p>This might take a few minutes, depending on the size of your league.</p><p>If something goes wrong, <a href="http://webmasters.stackexchange.com/questions/8525/how-to-open-the-javascript-console-in-different-browsers" target="_blank">open the console</a> and see if there is an error message there. Then <a href="https://basketball-gm.com/contact/" target="_blank">let us know about your problem</a>. Please include as much info as possible.</p>';

    function abortHandler(event) {
        if (!event.target.error) {
            // Transaction was manually aborted in code, such as during phase change. This is not an error.
            return;
        }

        if (event.target.error.name === "QuotaExceededError") {
            eventLog.add(null, {
                type: "error",
                text: 'Your browser isn\'t letting Basketball GM store any more data!<br><br>Try <a href="/">deleting some old leagues</a> or deleting old data (Tools > Improve Performance within a league). Clearing space elsewhere on your hard drive might help too.',
                saveToDb: false
            });
        } else {
            console.log("Database abort!");
            throw event.target.error;
        }
    }

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
     */
    function migrateMeta(event) {
        var dbm, tx;

        document.getElementById("content").innerHTML = migrateMessage;

        console.log("Upgrading meta database from version " + event.oldVersion + " to version " + event.newVersion);

        dbm = event.target.result;
        tx = event.currentTarget.transaction;
        tx.onabort = abortHandler;

        if (event.oldVersion <= 1) {
            dbm.deleteObjectStore("teams");
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
    }

    function connectMeta() {
        return new Promise(function (resolve, reject) {
            var request;

//        console.log('Connecting to database "meta"');
            request = indexedDB.open("meta", 7);
            request.onerror = function (event) {
                reject(event.target.error);
            };
            request.onblocked = function () {
                window.alert("Please close all other tabs with this site open!");
            };
            request.onupgradeneeded = function (event) {
                if (event.oldVersion === 0) {
                    createMeta(event);
                } else {
                    migrateMeta(event);
                }
            };
            request.onabort = abortHandler;
            request.onsuccess = function () {
                g.dbm = request.result;
                g.dbm.onerror = function (event) {
                    console.log(event);
                    throw event.target.error;
                };
                g.dbm.onabort = abortHandler;
                resolve();
            };
        });
    }

    /**
     * Create a new league database with the latest structure.
     *
     * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
     * @param {number} lid Integer league ID number for new league.
     */
    function createLeague(event, lid) {
        var dbl, draftPickStore, eventStore, gameStore, playerFeatStore, playerStatsStore, playerStore, releasedPlayerStore;

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
        playerFeatStore = dbl.createObjectStore("playerFeats", {keyPath: "fid", autoIncrement: true});

        playerStore.createIndex("tid", "tid", {unique: false});
        playerStore.createIndex("draft.year", "draft.year", {unique: false});
        playerStore.createIndex("retiredYear", "retiredYear", {unique: false});
        playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
        playerStatsStore.createIndex("pid, season, tid", ["pid", "season", "tid"], {unique: false}); // Would be unique if indexed on playoffs too, but that is a boolean and introduces complications... maybe worth fixing though? No, player could get traded back to same team in one season
//        gameStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used because currently the season index is used. If multiple indexes are eventually supported, then use this too.
        gameStore.createIndex("season", "season", {unique: false});
        releasedPlayerStore.createIndex("tid", "tid", {unique: false});
        releasedPlayerStore.createIndex("contract.exp", "contract.exp", {unique: false});
        draftPickStore.createIndex("season", "season", {unique: false});
        draftPickStore.createIndex("tid", "tid", {unique: false});
        eventStore.createIndex("season", "season", {unique: false});
        eventStore.createIndex("pids", "pids", {unique: false, multiEntry: true});
        playerFeatStore.createIndex("pid", "pid", {unique: false});
        playerFeatStore.createIndex("tid", "tid", {unique: false});
//        eventStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used currently, but might need to be added later
    }

    /**
     * Migrate a league database to the latest structure.
     *
     * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
     * @param {number} lid Integer league ID number.
     */
    function migrateLeague(event, lid) {
        var dbl, teams, tx;

        document.getElementById("content").innerHTML = migrateMessage;

        console.log("Upgrading league" + lid + " database from version " + event.oldVersion + " to version " + event.newVersion);

        dbl = event.target.result;
        tx = event.currentTarget.transaction;
        tx.onabort = abortHandler;

        // Make sure game attributes (i.e. g.startingSeason) are loaded first
        require("core/league").loadGameAttributes(tx).then(function () {
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
                    var cursor, game, i, j, update;

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
                    draft.genPlayers(tx, g.PLAYER.UNDRAFTED_3).then(function () {
                        return draft.genPlayers(tx, g.PLAYER.UNDRAFTED_2);
                    }).then(function () {
                        return dao.players.count({
                            ot: tx,
                            index: "tid",
                            key: g.PLAYER.UNDRAFTED
                        });
                    }).then(function (numPlayersUndrafted) {
                        if (numPlayersUndrafted === 0) {
                            return draft.genPlayers(tx, g.PLAYER.UNDRAFTED);
                        }
                    });
                }());
            }
            if (event.oldVersion <= 10) {
                (function () {
                    var playerStatsStore;

                    // Create new playerStats object store
                    playerStatsStore = dbl.createObjectStore("playerStats", {keyPath: "psid", autoIncrement: true});
                    playerStatsStore.createIndex("pid, season, tid", ["pid", "season", "tid"], {unique: false});

                    // For each player, add all his stats to playerStats store, delete his stats from player object, and rewrite player object
                    tx.objectStore("players").openCursor().onsuccess = function (event) {
                        var addStatsRows, afterStatsRows, cursor, p;

                        cursor = event.target.result;
                        if (cursor) {
                            p = cursor.value;

                            // watch is now mandatory!
                            if (!p.hasOwnProperty("watch")) {
                                p.watch = false;
                            }

                            afterStatsRows = function () {
                                // Save player object without stats and with values
                                delete p.stats;
                                require("core/player").updateValues(tx, p, []).then(function (p) {
                                    cursor.update(p);

                                    cursor.continue();
                                });
                            };

                            addStatsRows = function () {
                                var ps;

                                ps = p.stats.shift();

                                ps.pid = p.pid;

                                // Could be calculated correctly if I wasn't lazy
                                ps.yearsWithTeam = 0;

                                tx.objectStore("playerStats").add(ps).onsuccess = function () {
                                    // On to the next one
                                    if (p.stats.length > 0) {
                                        addStatsRows();
                                    } else {
                                        afterStatsRows();
                                    }
                                };
                            };

                            if (p.stats.length > 0) {
                                addStatsRows();
                            } else {
                                afterStatsRows();
                            }
                        }
                    };
                }());
            }
            if (event.oldVersion <= 11) {
                (function () {
                    tx.objectStore("events").createIndex("pids", "pids", {unique: false, multiEntry: true});
                }());
            }
            if (event.oldVersion <= 12) {
                (function () {
                    var playerFeatStore;
                    playerFeatStore = dbl.createObjectStore("playerFeats", {keyPath: "fid", autoIncrement: true});
                    playerFeatStore.createIndex("pid", "pid", {unique: false});
                    playerFeatStore.createIndex("tid", "tid", {unique: false});
                }());
            }
            if (event.oldVersion <= 13) {
                (function () {
                    tx.objectStore("gameAttributes").put({
                        key: "userTids",
                        value: [g.userTid]
                    });
                    if (g.numTeams === undefined) {
                        tx.objectStore("gameAttributes").put({
                            key: "numTeams",
                            value: 30
                        });
                    }
                    if (g.godMode === undefined) {
                        tx.objectStore("gameAttributes").put({
                            key: "godMode",
                            value: false
                        });
                    }
                    if (g.godModeInPast === undefined) {
                        tx.objectStore("gameAttributes").put({
                            key: "godModeInPast",
                            value: false
                        });
                    }
                    if (g.phaseChangeInProgress === undefined) {
                        tx.objectStore("gameAttributes").put({
                            key: "phaseChangeInProgress",
                            value: false
                        });
                    }
                    if (g.autoPlaySeasons === undefined) {
                        tx.objectStore("gameAttributes").put({
                            key: "autoPlaySeasons",
                            value: 0
                        });
                    }
                }());
            }
            if (event.oldVersion <= 14) {
                (function () {
                    tx.objectStore("games").openCursor().onsuccess = function (event) {
                        var cursor, game, i, j, update;

                        cursor = event.target.result;
                        update = false;

                        if (cursor) {
                            game = cursor.value;

                            // set BA, +/- to zero for boxscores
                            for (i = 0; i < game.teams.length; i++) {
                                for (j = 0; j < game.teams[i].players.length; j++) {
                                    if (game.teams[i].players[j].ba === undefined) {
                                        game.teams[i].players[j].ba = 0;
                                        update = true;
                                    }
                                    if (game.teams[i].players[j].pm === undefined) {
                                        game.teams[i].players[j].pm = 0;
                                        update = true;
                                    }
                                }
                            }

                            if (game.teams[0].ba === undefined) {
                                game.teams[0].ba = 0;
                                game.teams[1].ba = 0;
                                update = true;
                            }

                            if (update) { cursor.update(game); }
                            cursor.continue();
                        }
                    };

                    // set BA, +/- to zero for player stats
                    tx.objectStore("playerStats").openCursor().onsuccess = function (event) {
                        var cursor, ps, update;

                        cursor = event.target.result;
                        update = false;

                        if (cursor) {
                            ps = cursor.value;

                            if (!ps.hasOwnProperty("ba")) {
                                ps.ba = 0;
                                update = true;
                            }
                            if (!ps.hasOwnProperty("pm")) {
                                ps.pm = 0;
                                update = true;
                            }

                            if (update) { cursor.update(ps); }
                            cursor.continue();
                        }
                    };

                    // set BA to zero for team stats, +/- already handled
                    tx.objectStore("teams").openCursor().onsuccess = function (event) {
                        var cursor, i, t, update;

                        cursor = event.target.result;
                        update = false;

                        if (cursor) {
                            t = cursor.value;
                            for (i = 0; i < t.stats.length; i++) {
                                if (!t.stats[i].hasOwnProperty("ba")) {
                                    t.stats[i].ba = 0;
                                    update = true;
                                }
                            }

                            if (update) { cursor.update(t); }
                            cursor.continue();
                        }
                    };
                }());
            }
            if (event.oldVersion <= 15) {
                (function () {
                    // Put pos in ratings rather than root of player objects, so users can see it change over time
                    tx.objectStore("players").openCursor().onsuccess = function (event) {
                        var cursor, i, p;

                        cursor = event.target.result;

                        if (cursor) {
                            p = cursor.value;
                            for (i = 0; i < p.ratings.length; i++) {
                                p.ratings[i].pos = p.pos;
                            }
                            delete p.pos;

                            cursor.update(p);
                            cursor.continue();
                        }
                    };
                }());
            }
        });
    }

    function connectLeague(lid) {
        return new Promise(function (resolve, reject) {
            var request;

//        console.log('Connecting to database "league' + lid + '"');
            request = indexedDB.open("league" + lid, 16);
            request.onerror = function (event) {
                reject(event.target.error);
            };
            request.onblocked = function () {
                window.alert("Please close all other tabs with this site open!");
            };
            request.onupgradeneeded = function (event) {
                if (event.oldVersion === 0) {
                    createLeague(event, lid);
                } else {
                    migrateLeague(event, lid);
                }
            };
            request.onabort = abortHandler;
            request.onsuccess = function () {
                g.dbl = request.result;
                g.dbl.onerror = function (event) {
                    console.log(event);
                    throw event.target.error;
                };
                g.dbl.onabort = abortHandler;
                resolve();
            };
        });
    }

    function reset() {
        var debug, key;

        // localStorage, which is just use for table sorting currently
        debug = localStorage.debug; // Save debug setting and restore later
        for (key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                localStorage.removeItem(key);
            }
        }
        localStorage.debug = debug;

        // Delete any current league databases
        console.log("Deleting any current league databases...");
        dao.leagues.getAll().then(function (leagues) {
            if (leagues.length === 0) {
                console.log('No leagues found.');
                Davis.location.assign(new Davis.Request("/"));
            }

            Promise.map(leagues, function (l) {
                return require("core/league").remove(l.lid);
            }, {concurrency: Infinity}).then(function () {
                var request;

                // Delete any current meta database
                console.log("Deleting any current meta database...");
                g.dbm.close();
                request = indexedDB.deleteDatabase("meta");
                request.onsuccess = function () {
                    location.reload();
                };
            });
        });
    }

    return {
        connectMeta: connectMeta,
        connectLeague: connectLeague,
        reset: reset
    };
});