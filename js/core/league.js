/**
 * @name core.league
 * @namespace Creating and removing leagues.
 */
define(["db", "globals", "ui", "core/finances", "core/player", "core/season", "core/team", "lib/faces", "lib/jquery", "util/helpers", "util/random"], function (db, g, ui, finances, player, season, team, faces, $, helpers, random) {
    "use strict";

    /**
     * Create a new league.
     * 
     * @memberOf core.league
     * @param {string} name The name of the league.
     * @param {number} tid The team ID for the team the user wants to manage.
     * @param {Array.<Object>?} players Either an array of pre-generated player objects to use in the new league or undefined. If undefined, then random players will be generated.
     */
    function create(name, tid, players, cb) {
        var l, leagueStore;

        l = {name: name, tid: tid, phaseText: ""};
        leagueStore = g.dbm.transaction("leagues", "readwrite").objectStore("leagues");
        leagueStore.add(l).onsuccess = function (event) {
            var teams;

            g.lid = event.target.result;

            teams = helpers.getTeams();

            // Create new league database
            db.connectLeague(g.lid, function () {
                var gameAttributes, key, startingSeason;

                startingSeason = 2013;
                gameAttributes = {
                    userTid: tid,
                    season: startingSeason,
                    startingSeason: startingSeason,
                    phase: 0,
                    gamesInProgress: false,
                    stopGames: false,
                    lastDbChange: 0,
                    leagueName: name,
                    ownerMood: {
                        wins: 0,
                        playoffs: 0,
                        money: 0
                    },
                    gameOver: false
                };

                // Clear old game attributes from g, to make sure the new ones are saved to the db in db.setGameAttributes
                helpers.resetG();

                db.setGameAttributes(gameAttributes, function () {
                    var draftPickStore, i, t, round, scoutingRank, teamStore, transaction;

                    // Probably is fastest to use this transaction for everything done to create a new league
                    transaction = g.dbl.transaction(["draftPicks", "draftOrder", "players", "teams", "trade"], "readwrite");

                    // Generate draft picks for the first 4 years, as those are the ones can be traded initially
                    draftPickStore = transaction.objectStore("draftPicks");
                    for (i = 0; i < 4; i++) {
                        for (t = 0; t < 30; t++) {
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

                    // Initialize draft order object store for later use
                    transaction.objectStore("draftOrder").add({
                        rid: 1,
                        draftOrder: []
                    });

                    // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
                    teamStore = transaction.objectStore("teams");
                    for (i = 0; i < teams.length; i++) {
                        t = team.generate(teams[i]);
                        teamStore.add(t);

                        // Save scoutingRank for later
                        if (i === g.userTid) {
                            scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");
                        }
                    }

                    transaction.objectStore("trade").add({
                        rid: 0,
                        otherTid: tid === 0 ? 1 : 0,  // Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1)
                        otherPids: [],
                        userPids: [],
                        otherDpids: [],
                        userDpids: []
                    });

                    player.genBaseMoods(transaction, function (baseMoods) {
                        var afterPlayerCreation, age, agingYears, baseRatings, cbAfterEachPlayer, contract, draftYear, goodNeutralBad, i, j, n, numLeft, p, pg, playerStore, pots, profile, profiles, randomizeExpiration, simpleDefaults, t, t2;

                        // This can't be in transaction.oncomplete because loading players from a json file is async and breaks the transaction.
                        afterPlayerCreation = function () {
                            // Make schedule, start season
                            season.newPhase(g.PHASE.REGULAR_SEASON, function () {
                                var lid;

                                ui.updateStatus("Idle");

                                lid = g.lid;  // Otherwise, g.lid can be overwritten before the URL redirects, and then we no longer know the league ID

                                // Auto sort player's roster (other teams will be done in season.newPhase(g.PHASE.REGULAR_SEASON))
                                team.rosterAutoSort(null, g.userTid, function () { cb(lid); });

                                helpers.bbgmPing("league");
                            });
                        };

                        cbAfterEachPlayer = function () {
                            numLeft -= 1;
                            if (numLeft === 0) {
                                afterPlayerCreation();
                            }
                        };

                        if (players !== undefined) {
                            // Use pre-generated players, filling in attributes as needed
                            playerStore = g.dbl.transaction("players", "readwrite").objectStore("players");  // Transaction used above is closed by now

                            numLeft = players.length;
                            for (i = 0; i < players.length; i++) {
                                p = players[i];

                                if (!p.hasOwnProperty("born")) {
                                    age = random.randInt(19, 35);
                                } else {
                                    age = g.startingSeason - p.born.year;
                                }

                                // This is used to get at default values for various attributes
                                pg = player.generate(p.tid, age, "", 0, 0, g.startingSeason - age, true, scoutingRank);

                                // Optional things
                                simpleDefaults = ["awards", "born", "college", "contract", "draft", "face", "freeAgentMood", "hgt", "injury", "pos", "ptModifier", "retiredYear", "rosterOrder", "weight", "yearsFreeAgent"];
                                for (j = 0; j < simpleDefaults.length; j++) {
                                    if (!p.hasOwnProperty(simpleDefaults[j])) {
                                        p[simpleDefaults[j]] = pg[simpleDefaults[j]];
                                    }
                                }
                                if (!p.hasOwnProperty("salaries")) {
                                    p.salaries = [];
                                    if (p.tid >= 0) {
                                        p = player.setContract(p, p.contract, true);
                                    }
                                }
                                if (!p.hasOwnProperty("statsTids")) {
                                    p.statsTids = [];
                                }
                                if (!p.ratings[0].hasOwnProperty("fuzz")) {
                                    p.ratings[0].fuzz = pg.ratings[0].fuzz;
                                }
                                if (!p.ratings[0].hasOwnProperty("skills")) {
                                    p.ratings[0].skills = player.skills(p.ratings[0]);
                                }
                                if (!p.ratings[0].hasOwnProperty("ovr")) {
                                    p.ratings[0].ovr = player.ovr(p.ratings[0]);
                                }
                                if (p.ratings[0].pot < p.ratings[0].ovr) {
                                    p.ratings[0].pot = p.ratings[0].ovr;
                                }

                                // Fix always-missing info
                                p.ratings[0].season = g.startingSeason;
                                if (!p.hasOwnProperty("stats")) {
                                    p.stats = [];
                                    if (p.tid >= 0) {
                                        p = player.addStatsRow(p, false);
                                    }
                                }

                                if (p.tid === g.PLAYER.FREE_AGENT) {
                                    player.addToFreeAgents(playerStore, p, null, baseMoods, cbAfterEachPlayer);
                                } else {
                                    playerStore.put(p);
                                    cbAfterEachPlayer();
                                }
                            }
                        } else {
                            // Generate new players
                            playerStore = transaction.objectStore("players");
                            profiles = ["Point", "Wing", "Big", ""];
                            baseRatings = [37, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 26, 26, 26];
                            pots = [75, 65, 55, 55, 60, 50, 70, 40, 55, 50, 60, 60, 45, 45];

                            numLeft = 33 * 14;
                            for (t = -3; t < 30; t++) {
                                // Create multiple "teams" worth of players for the free agent pool
                                if (t < 0) {
                                    t2 = g.PLAYER.FREE_AGENT;
                                } else {
                                    t2 = t;
                                }

                                goodNeutralBad = random.randInt(-1, 1);  // determines if this will be a good team or not
                                random.shuffle(pots);
                                for (n = 0; n < 14; n++) {
                                    profile = profiles[random.randInt(0, profiles.length - 1)];
                                    agingYears = random.randInt(0, 13);
                                    draftYear = g.startingSeason - 1 - agingYears;

                                    p = player.generate(t2, 19, profile, baseRatings[n], pots[n], draftYear, true, scoutingRank);
                                    p = player.develop(p, agingYears, true);
                                    if (n < 5) {
                                        p = player.bonus(p, goodNeutralBad * random.randInt(0, 20), true);
                                    } else {
                                        p = player.bonus(p, 0, true);
                                    }
                                    if (t2 === g.PLAYER.FREE_AGENT) {  // Free agents
                                        p = player.bonus(p, -15, false);
                                    }

                                    if (t2 === g.PLAYER.FREE_AGENT) {
                                        player.addToFreeAgents(playerStore, p, null, baseMoods, cbAfterEachPlayer);
                                    } else {
                                        playerStore.put(p);
                                        cbAfterEachPlayer();
                                    }
                                }
                            }
                        }
                    });
                });
            });
        };
    }

    /**
     * Delete an existing league.
     * 
     * @memberOf core.league
     * @param {number} lid League ID.
     * @param {function()=} cb Optional callback.
     */
    function remove(lid, cb) {
        var request;

        if (g.dbl !== undefined) {
            g.dbl.close();
        }

        g.dbm.transaction("leagues", "readwrite").objectStore("leagues").delete(lid);
        request = indexedDB.deleteDatabase("league" + lid);
        request.onsuccess = function (event) {
            console.log("Database league" + lid + " successfully deleted");
            cb();
        };
        request.onfailure = function (event) {
            console.log("Error: ", event);
            cb();
        };
        request.onblocked = function (event) {
            console.log("Blocked: ", event);
            cb();
        };
    }


    /**
     * Export an existing league.
     * 
     * @memberOf core.league
     * @param {number} lid League ID.
     * @param {function(Object)} cb Callback whose first argument contains all the exported league data.
     */
    function export_(lid, cb) {
        if (g.dbl !== undefined) {
            g.dbl.close();
        }

        g.dbm.transaction("leagues").objectStore("leagues").get(lid).onsuccess = function (event) {
            var exportedLeague;

            exportedLeague = {};

            // Row from leagueStore
            exportedLeague.metadata = event.target.result;

            db.connectLeague(lid, function () {
                var exportStore, stores;

                stores = ["players", "teams", "games", "schedule", "playoffSeries", "releasedPlayers", "awards", "trade", "draftOrder", "negotiations", "gameAttributes"];

                exportStore = function (i, cb) {
                    console.log("Exporting " + stores[i] + "...");
                    g.dbl.transaction(stores[i]).objectStore(stores[i]).getAll().onsuccess = function (event) {
                        exportedLeague[stores[i]] = event.target.result;

                        if (i > 0) {
                            exportStore(i - 1, cb);
                        } else {
                            cb(exportedLeague);
                        }
                    };
                };

                // Iterate through all the stores
                exportStore(stores.length - 1, cb);
            });
        };
    }

    return {
        create: create,
        export_: export_,
        remove: remove
    };
});