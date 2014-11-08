/**
 * @name core.league
 * @namespace Creating and removing leagues.
 */
define(["dao", "db", "globals", "ui", "core/draft", "core/finances", "core/player", "core/season", "core/team", "lib/underscore", "util/helpers", "util/random"], function (dao, db, g, ui, draft, finances, player, season, team, _, helpers, random) {
    "use strict";

    // x and y are both arrays of objects with the same length. For each object, any properties in y but not x will be copied over to x.
    function merge(x, y) {
        var i, prop;

        for (i = 0; i < x.length; i++) {
            // Fill in default values as needed
            for (prop in y[i]) {
                if (y[i].hasOwnProperty(prop) && !x[i].hasOwnProperty(prop)) {
                    x[i][prop] = y[i][prop];
                }
            }
        }

        return x;
    }

    /**
     * Create a new league.
     * 
     * @memberOf core.league
     * @param {string} name The name of the league.
     * @param {number} tid The team ID for the team the user wants to manage (or -1 for random).
     */
    function create(name, tid, leagueFile, startingSeason, randomizeRosters, cb) {
        var l, leagueStore, phaseText, teams, teamsDefault;

        // Any user input?
        if (!leagueFile) {
            leagueFile = {}; // Allow checking of properties
        }

        // Default teams
        teamsDefault = helpers.getTeamsDefault();

        // Any custom teams?
        if (leagueFile.hasOwnProperty("teams")) {
            teams = merge(leagueFile.teams, teamsDefault);

            // Add in popRanks
            teams = helpers.addPopRank(teams);
        } else {
            teams = teamsDefault;
        }

        // Handle random team
        if (tid === -1) {
            tid = random.randInt(0, teams.length - 1);
        }

        if (leagueFile.hasOwnProperty("meta") && leagueFile.meta.hasOwnProperty("phaseText")) {
            phaseText = leagueFile.meta.phaseText;
        } else {
            phaseText =  "";
        }

        // Record in meta db
        l = {name: name, tid: tid, phaseText: phaseText, teamName: teams[tid].name, teamRegion: teams[tid].region};
        leagueStore = g.dbm.transaction("leagues", "readwrite").objectStore("leagues");
        leagueStore.add(l).onsuccess = function (event) {
            g.lid = event.target.result;

            // Create new league database
            db.connectLeague(g.lid, function () {
                var gameAttributes, i, skipNewPhase;

                // Default values
                gameAttributes = {
                    userTid: tid,
                    season: startingSeason,
                    startingSeason: startingSeason,
                    phase: 0,
                    nextPhase: null, // Used only for fantasy draft
                    daysLeft: 0, // Used only for free agency
                    gamesInProgress: false,
                    stopGames: false,
                    lastDbChange: 0,
                    leagueName: name,
                    ownerMood: {
                        wins: 0,
                        playoffs: 0,
                        money: 0
                    },
                    gameOver: false,
                    teamAbbrevsCache: _.pluck(teams, "abbrev"),
                    teamRegionsCache: _.pluck(teams, "region"),
                    teamNamesCache: _.pluck(teams, "name"),
                    showFirstOwnerMessage: true, // true when user starts with a new team, so initial owner message can be shown
                    gracePeriodEnd: startingSeason + 2, // Can't get fired for the first two seasons
                    numTeams: teams.length // Will be 30 if the user doesn't supply custom rosters
                };

                // gameAttributes from input
                skipNewPhase = false;
                if (leagueFile.hasOwnProperty("gameAttributes")) {
                    for (i = 0; i < leagueFile.gameAttributes.length; i++) {
                        // Set default for anything except team ID and name, since they can be overwritten by form input.
                        if (leagueFile.gameAttributes[i].key !== "userTid" && leagueFile.gameAttributes[i].key !== "leagueName") {
                            gameAttributes[leagueFile.gameAttributes[i].key] = leagueFile.gameAttributes[i].value;
                        }

                        if (leagueFile.gameAttributes[i].key === "phase") {
                            skipNewPhase = true;
                        }
                    }
                }

                // Clear old game attributes from g, to make sure the new ones are saved to the db in db.setGameAttributes
                helpers.resetG();

                db.setGameAttributes(gameAttributes, function () {
                    var i, j, t, round, scoutingRank, teamStore, toMaybeAdd, tx;

                    // Probably is fastest to use this transaction for everything done to create a new league
                    tx = g.dbl.transaction(["draftPicks", "draftOrder", "players", "playerStats", "teams", "trade", "releasedPlayers", "awards", "schedule", "playoffSeries", "negotiations", "messages", "games"], "readwrite");

                    // Draft picks for the first 4 years, as those are the ones can be traded initially
                    if (leagueFile.hasOwnProperty("draftPicks")) {
                        for (i = 0; i < leagueFile.draftPicks.length; i++) {
                            tx.objectStore("draftPicks").add(leagueFile.draftPicks[i]);
                        }
                    } else {
                        for (i = 0; i < 4; i++) {
                            for (t = 0; t < g.numTeams; t++) {
                                for (round = 1; round <= 2; round++) {
                                    tx.objectStore("draftPicks").add({
                                        tid: t,
                                        originalTid: t,
                                        round: round,
                                        season: g.startingSeason + i
                                    });
                                }
                            }
                        }
                    }

                    // Initialize draft order object store for later use
                    if (leagueFile.hasOwnProperty("draftOrder")) {
                        for (i = 0; i < leagueFile.draftOrder.length; i++) {
                            tx.objectStore("draftOrder").add(leagueFile.draftOrder[i]);
                        }
                    } else {
                        tx.objectStore("draftOrder").add({
                            rid: 1,
                            draftOrder: []
                        });
                    }

                    // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
                    teamStore = tx.objectStore("teams");
                    for (i = 0; i < g.numTeams; i++) {
                        t = team.generate(teams[i]);
                        teamStore.add(t);

                        // Save scoutingRank for later
                        if (i === g.userTid) {
                            scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");
                        }
                    }

                    if (leagueFile.hasOwnProperty("trade")) {
                        for (i = 0; i < leagueFile.trade.length; i++) {
                            tx.objectStore("trade").add(leagueFile.trade[i]);
                        }
                    } else {
                        tx.objectStore("trade").add({
                            rid: 0,
                            teams: [
                                {
                                    tid: tid,
                                    pids: [],
                                    dpids: []
                                },
                                {
                                    tid: tid === 0 ? 1 : 0,  // Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
                                    pids: [],
                                    dpids: []
                                }
                            ]
                        });
                    }

                    // These object stores are blank by default
                    toMaybeAdd = ["releasedPlayers", "awards", "schedule", "playoffSeries", "negotiations", "messages", "games"];
                    for (j = 0; j < toMaybeAdd.length; j++) {
                        if (leagueFile.hasOwnProperty(toMaybeAdd[j])) {
                            for (i = 0; i < leagueFile[toMaybeAdd[j]].length; i++) {
                                tx.objectStore(toMaybeAdd[j]).add(leagueFile[toMaybeAdd[j]][i]);
                            }
                        }
                    }

                    player.genBaseMoods(tx, function (baseMoods) {
                        var afterPlayerCreation, agingYears, baseRatings, cbAfterEachPlayer, contract, draftYear, goodNeutralBad, i, j, n, numLeft, p, players, pots, profile, profiles, randomizeExpiration, t, t2, playerTids;

                        afterPlayerCreation = function () {
                            var createUndrafted1, createUndrafted2, createUndrafted3, i;

                            // Use a new transaction so there is no race condition with generating draft prospects and regular players (PIDs can seemingly collide otherwise, if it's an imported roster)
                            tx = g.dbl.transaction(["players", "playerStats"], "readwrite");

                            // See if imported roster has draft picks included. If so, create less than 70 (scaled for number of teams)
                            createUndrafted1 = Math.round(70 * g.numTeams / 30);
                            createUndrafted2 = Math.round(70 * g.numTeams / 30);
                            createUndrafted3 = Math.round(70 * g.numTeams / 30);
                            if (players !== undefined) {
                                for (i = 0; i < players.length; i++) {
                                    if (players[i].tid === g.PLAYER.UNDRAFTED) {
                                        createUndrafted1 -= 1;
                                    } else if (players[i].tid === g.PLAYER.UNDRAFTED_2) {
                                        createUndrafted2 -= 1;
                                    } else if (players[i].tid === g.PLAYER.UNDRAFTED_3) {
                                        createUndrafted3 -= 1;
                                    }
                                }
                            }
                            if (createUndrafted1) {
                                draft.genPlayers(tx, g.PLAYER.UNDRAFTED, scoutingRank, createUndrafted1);
                            }
                            if (createUndrafted2) {
                                draft.genPlayers(tx, g.PLAYER.UNDRAFTED_2, scoutingRank, createUndrafted2);
                            }
                            if (createUndrafted3) {
                                draft.genPlayers(tx, g.PLAYER.UNDRAFTED_3, scoutingRank, createUndrafted3);
                            }

                            tx.oncomplete = function () {
                                if (skipNewPhase) {
                                    // Game already in progress, just start it
                                    cb(g.lid);
                                } else {
                                    // Make schedule, start season
                                    season.newPhase(g.PHASE.REGULAR_SEASON, function () {
                                        var lid;

                                        ui.updateStatus("Idle");

                                        lid = g.lid; // Otherwise, g.lid can be overwritten before the URL redirects, and then we no longer know the league ID

                                        // Auto sort player's roster (other teams will be done in season.newPhase(g.PHASE.REGULAR_SEASON))
                                        team.rosterAutoSort(null, g.userTid, function () { cb(lid); });

                                        helpers.bbgmPing("league");
                                    });
                                }
                            };
                        };

                        cbAfterEachPlayer = function () {
                            numLeft -= 1;
                            if (numLeft === 0) {
                                afterPlayerCreation();
                            }
                        };

                        if (leagueFile.hasOwnProperty("players")) {
                            players = leagueFile.players;

                            // Use pre-generated players, filling in attributes as needed
                            tx = g.dbl.transaction(["players", "playerStats"], "readwrite");  // Transaction used above is closed by now

                            // Does the player want the rosters randomized?
                            if (randomizeRosters) {
                                // Assign the team ID of all players to the 'playerTids' array.
                                // Check tid to prevent draft prospects from being swapped with established players
                                playerTids = _.pluck(players.filter(function (p) { return p.tid >= g.PLAYER.FREE_AGENT; }), "tid");

                                // Shuffle the teams that players are assigned to.
                                random.shuffle(playerTids);
                                for (i = 0; i < players.length; i++) {
                                    if (players[i].tid >= g.PLAYER.FREE_AGENT) {
                                        players[i].tid = playerTids.pop();
                                    }
                                }
                            }

                            numLeft = players.length;
                            for (i = 0; i < players.length; i++) {
                                p = players[i];

                                (function (p) {
                                    var playerStats;

                                    p = player.augmentPartialPlayer(p, scoutingRank);

                                    // Separate out stats
                                    playerStats = p.stats;
                                    delete p.stats;

                                    player.updateValues(tx, p, playerStats.reverse(), function (p) {
                                        dao.players.put({ot: tx, p: p, onsuccess: function (event) {
                                            var addStatsRows, i;

                                            // When adding a player, this is the only way to know the pid
                                            p.pid = event.target.result;

                                            // If no stats in League File, create blank stats rows for active players if necessary
                                            if (playerStats.length === 0) {
                                                if (p.tid >= 0) {
                                                    // Needs pid, so must be called after put. It's okay, statsTid was already set in player.augmentPartialPlayer
                                                    player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS, function (p) {
                                                        cbAfterEachPlayer();
                                                    });
                                                } else {
                                                    cbAfterEachPlayer();
                                                }
                                            } else {
                                                // If there are stats in the League File, add them to the database
                                                addStatsRows = function () {
                                                    var ps;

                                                    ps = playerStats.pop();

                                                    // Augment with pid, if it's not already there - can't be done in player.augmentPartialPlayer because pid is not known at that point
                                                    ps.pid = p.pid;

                                                    // Could be calculated correctly if I wasn't lazy
                                                    if (!ps.hasOwnProperty("yearsWithTeam")) {
                                                        ps.yearsWithTeam = 0;
                                                    }

                                                    // Delete psid because it can cause problems due to interaction addStatsRow above
                                                    delete ps.psid;

                                                    tx.objectStore("playerStats").add(ps).onsuccess = function () {
                                                        // On to the next one
                                                        if (playerStats.length > 0) {
                                                            addStatsRows();
                                                        } else {
                                                            cbAfterEachPlayer();
                                                        }
                                                    };
                                                };
                                                addStatsRows();
                                            }
                                        }});
                                    });
                                }(p));
                            }
                        } else {
                            // Generate new players
                            profiles = ["Point", "Wing", "Big", ""];
                            baseRatings = [37, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 26, 26, 26];
                            pots = [75, 65, 55, 55, 60, 50, 70, 40, 55, 50, 60, 60, 45, 45];

                            numLeft = 33 * 14;
                            for (t = -3; t < teams.length; t++) {
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
                                        p = player.bonus(p, goodNeutralBad * random.randInt(0, 20));
                                    } else {
                                        p = player.bonus(p, 0);
                                    }
                                    if (t2 === g.PLAYER.FREE_AGENT) {  // Free agents
                                        p = player.bonus(p, -15);
                                    }

                                    // Hack to account for player.addStatsRow being called after dao.players.put - manually assign statsTids
                                    if (p.tid >= 0) {
                                        p.statsTids = [p.tid];
                                    }

                                    // Update player values after ratings changes
                                    player.updateValues(tx, p, [], function (p) {
                                        var randomizeExp;

                                        // Randomize contract expiration for players who aren't free agents, because otherwise contract expiration dates will all be synchronized
                                        randomizeExp = (p.tid !== g.PLAYER.FREE_AGENT);

                                        // Update contract based on development. Only write contract to player log if not a free agent.
                                        p = player.setContract(p, player.genContract(p, randomizeExp), p.tid >= 0);

                                        // Save to database
                                        if (t2 === g.PLAYER.FREE_AGENT) {
                                            player.addToFreeAgents(tx, p, null, baseMoods, cbAfterEachPlayer);
                                        } else {
                                            dao.players.put({ot: tx, p: p, onsuccess: function (event) {
                                                // When adding a player, this is the only way to know the pid
                                                p.pid = event.target.result;

                                                // Needs pid, so must be called after put. It's okay, statsTid was already set above
                                                player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS, function (p) {
                                                    cbAfterEachPlayer();
                                                });
                                            }});
                                        }
                                    });
                                }

                                // Initialize rebuilding/contending, when possible
                                if (t2 >= 0 && goodNeutralBad === 1) {
                                    teamStore.openCursor(t2).onsuccess = function (event) {
                                        var cursor, t;

                                        cursor = event.target.result;
                                        t = cursor.value;
                                        t.strategy = "contending";
                                        cursor.update(t);
                                    };
                                } else if (t2 >= 0 && goodNeutralBad === -1) {
                                    teamStore.openCursor(t2).onsuccess = function (event) {
                                        var cursor, t;

                                        cursor = event.target.result;
                                        t = cursor.value;
                                        t.strategy = "rebuilding";
                                        cursor.update(t);
                                    };
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
     * Export existing active league.
     * 
     * @memberOf core.league
     * @param {string[]} stores Array of names of objectStores to include in export
     * @param {function(Object)} cb Callback whose first argument contains all the exported league data.
     */
    function export_(stores, cb) {
        var exportedLeague,  exportStore, movePlayerStats;

        exportedLeague = {};

        // Row from leagueStore in meta db.
        // phaseText is needed if a phase is set in gameAttributes.
        // name is only used for the file name of the exported roster file.
        exportedLeague.meta = {phaseText: g.phaseText, name: g.leagueName};

        exportStore = function (i) {
            g.dbl.transaction(stores[i]).objectStore(stores[i]).getAll().onsuccess = function (event) {
                exportedLeague[stores[i]] = event.target.result;

                if (i > 0) {
                    exportStore(i - 1);
                } else {
                    movePlayerStats();
                }
            };
        };

        // Move playerStats to players object, similar to old DB structure. Makes editing JSON output nicer.
        movePlayerStats = function () {
            var i, j, pid;

            if (stores.indexOf("playerStats") >= 0) {
                for (i = 0; i < exportedLeague.playerStats.length; i++) {
                    pid = exportedLeague.playerStats[i].pid;

                    // Find player corresponding with that stats row
                    for (j = 0; j < exportedLeague.players.length; j++) {
                        if (exportedLeague.players[j].pid === pid) {
                            if (!exportedLeague.players[j].hasOwnProperty("stats")) {
                                exportedLeague.players[j].stats = [];
                            }

                            exportedLeague.players[j].stats.push(exportedLeague.playerStats[i]);

                            break;
                        }
                    }
                }

                delete exportedLeague.playerStats;

                cb(exportedLeague);
            } else {
                cb(exportedLeague);
            }
        }

        // Iterate through all the stores
        exportStore(stores.length - 1, cb);
    }

    return {
        create: create,
        export_: export_,
        remove: remove
    };
});