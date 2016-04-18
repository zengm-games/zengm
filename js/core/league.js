const db = require('../db');
const g = require('../globals');
const ui = require('../ui');
const draft = require('./draft');
const finances = require('./finances');
const phase = require('./phase');
const player = require('./player');
const team = require('./team');
const Promise = require('bluebird');
const $ = require('jquery');
const _ = require('underscore');
const helpers = require('../util/helpers');
const random = require('../util/random');

const defaultGameAttributes = {
    phase: 0,
    nextPhase: null, // Used only for fantasy draft
    daysLeft: 0, // Used only for free agency
    gamesInProgress: false,
    phaseChangeInProgress: false,
    stopGames: false,
    lastDbChange: 0,
    ownerMood: {
        wins: 0,
        playoffs: 0,
        money: 0
    },
    gameOver: false,
    showFirstOwnerMessage: true, // true when user starts with a new team, so initial owner message can be shown
    autoPlaySeasons: 0,
    godMode: false,
    godModeInPast: false,
    salaryCap: 60000, // [thousands of dollars]
    minPayroll: 40000, // [thousands of dollars]
    luxuryPayroll: 65000, // [thousands of dollars]
    luxuryTax: 1.5,
    minContract: 500, // [thousands of dollars]
    maxContract: 20000, // [thousands of dollars]
    minRosterSize: 10,
    numGames: 82, // per season
    quarterLength: 12, // [minutes]
    disableInjuries: false
};

// x and y are both arrays of objects with the same length. For each object, any properties in y but not x will be copied over to x.
function merge(x, y) {
    let i, prop;

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
 * Set values in the gameAttributes objectStore and update the global variable g.
 *
 * Items stored in gameAttributes are globally available through the global variable g. If a value is a constant across all leagues/games/whatever, it should just be set in globals.js instead.
 *
 * @param {Object} gameAttributes Each property in the object will be inserted/updated in the database with the key of the object representing the key in the database.
 * @returns {Promise} Promise for when it finishes.
 */
function setGameAttributes(tx, gameAttributes) {
    let key, toUpdate;

    toUpdate = [];
    for (key in gameAttributes) {
        if (gameAttributes.hasOwnProperty(key)) {
            if (g[key] !== gameAttributes[key]) {
                toUpdate.push(key);
            }
        }
    }

    return Promise.map(toUpdate, key => tx.gameAttributes.put({
        key,
        value: gameAttributes[key]
    }).then(() => {
        g[key] = gameAttributes[key];

        if (key === "userTid" || key === "userTids") {
            g.vm.multiTeam[key](gameAttributes[key]);
        }
    }).then(() => {
        // Trigger a signal for the team finances view. This is stupid.
        if (key === "gamesInProgress") {
            if (gameAttributes[key]) {
                $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStart");
            } else {
                $("#finances-settings, #free-agents, #live-games-list").trigger("gameSimulationStop");
            }
        }
    }));
}

// Calls setGameAttributes and ensures transaction is complete. Otherwise, manual transaction managment would always need to be there like this
function setGameAttributesComplete(gameAttributes) {
    return g.dbl.tx("gameAttributes", "readwrite", tx => setGameAttributes(tx, gameAttributes));
}

// Call this after doing DB stuff so other tabs know there is new data.
// Runs in its own transaction, shouldn't be waited for because this only influences other tabs
function updateLastDbChange() {
    setGameAttributesComplete({lastDbChange: Date.now()});
}

/**
 * Create a new league.
 *
 * @memberOf core.league
 * @param {string} name The name of the league.
 * @param {number} tid The team ID for the team the user wants to manage (or -1 for random).
 */
function create(name, tid, leagueFile, startingSeason, randomizeRosters) {
    let phaseText, skipNewPhase, teams, teamsDefault;

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
        phaseText = "";
    }

    // Record in meta db
    return g.dbm.leagues.add({
        name,
        tid,
        phaseText,
        teamName: teams[tid].name,
        teamRegion: teams[tid].region
    }).then(lid => {
        g.lid = lid;

        // Create new league database
        return db.connectLeague(g.lid);
    }).then(() => {
        let gameAttributes, i;

        // Default values
        gameAttributes = _.extend(helpers.deepCopy(defaultGameAttributes), {
            userTid: tid,
            userTids: [tid],
            season: startingSeason,
            startingSeason,
            leagueName: name,
            teamAbbrevsCache: _.pluck(teams, "abbrev"),
            teamRegionsCache: _.pluck(teams, "region"),
            teamNamesCache: _.pluck(teams, "name"),
            gracePeriodEnd: startingSeason + 2, // Can't get fired for the first two seasons
            numTeams: teams.length // Will be 30 if the user doesn't supply custom rosters
        });

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

            // Special case for userTids - don't use saved value if userTid is not in it
            if (gameAttributes.userTids.indexOf(gameAttributes.userTid) < 0) {
                gameAttributes.userTids = [gameAttributes.userTid];
            }
        }

        // Clear old game attributes from g, to make sure the new ones are saved to the db in setGameAttributes
        helpers.resetG();

        return setGameAttributesComplete(gameAttributes);
    }).then(() => {
        let i, j, k, round, scoutingRank, t, teamSeasons, teamStats, toMaybeAdd;

        return g.dbl.tx(["draftPicks", "draftOrder", "players", "playerStats", "teams", "teamSeasons", "teamStats", "trade", "releasedPlayers", "awards", "schedule", "playoffSeries", "negotiations", "messages", "games", "events", "playerFeats"], "readwrite", tx => {
            // Draft picks for the first 4 years, as those are the ones can be traded initially
            if (leagueFile.hasOwnProperty("draftPicks")) {
                for (i = 0; i < leagueFile.draftPicks.length; i++) {
                    tx.draftPicks.add(leagueFile.draftPicks[i]);
                }
            } else {
                for (i = 0; i < 4; i++) {
                    for (t = 0; t < g.numTeams; t++) {
                        for (round = 1; round <= 2; round++) {
                            tx.draftPicks.add({
                                tid: t,
                                originalTid: t,
                                round,
                                season: g.startingSeason + i
                            });
                        }
                    }
                }
            }

            // Initialize draft order object store for later use
            if (leagueFile.hasOwnProperty("draftOrder")) {
                for (i = 0; i < leagueFile.draftOrder.length; i++) {
                    tx.draftOrder.add(leagueFile.draftOrder[i]);
                }
            } else {
                tx.draftOrder.add({
                    rid: 1,
                    draftOrder: []
                });
            }

            // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
            for (i = 0; i < g.numTeams; i++) {
                t = team.generate(teams[i]);
                tx.teams.add(t);

                if (teams[i].hasOwnProperty("seasons")) {
                    teamSeasons = teams[i].seasons;
                } else {
                    teamSeasons = [team.genSeasonRow(t.tid)];
                    teamSeasons[0].pop = teams[i].pop;
                }
                teamSeasons.forEach(teamSeason => {
                    teamSeason.tid = t.tid;
                    tx.teamSeasons.add(teamSeason);
                });

                if (teams[i].hasOwnProperty("stats")) {
                    teamStats = teams[i].stats;
                } else {
                    teamStats = [team.genStatsRow(t.tid)];
                }
                teamStats.forEach(teamStat => {
                    teamStat.tid = t.tid;
                    if (!teamStat.hasOwnProperty("ba")) {
                        teamStat.ba = 0;
                    }
                    tx.teamStats.add(teamStat);
                });

                // Save scoutingRank for later
                if (i === g.userTid) {
                    scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");
                }
            }

            if (leagueFile.hasOwnProperty("trade")) {
                for (i = 0; i < leagueFile.trade.length; i++) {
                    tx.trade.add(leagueFile.trade[i]);
                }
            } else {
                tx.trade.add({
                    rid: 0,
                    teams: [
                        {
                            tid,
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

            // Fix missing +/-, blocks against in boxscore
            if (leagueFile.hasOwnProperty("games")) {
                for (i = 0; i < leagueFile.games.length; i++) {
                    if (!leagueFile.games[i].teams[0].hasOwnProperty("ba")) {
                        leagueFile.games[i].teams[0].ba = 0;
                        leagueFile.games[i].teams[1].ba = 0;
                    }
                    for (j = 0; j < leagueFile.games[i].teams.length; j++) {
                        for (k = 0; k < leagueFile.games[i].teams[j].players.length; k++) {
                            if (!leagueFile.games[i].teams[j].players[k].hasOwnProperty("ba")) {
                                leagueFile.games[i].teams[j].players[k].ba = 0;
                            }
                            if (!leagueFile.games[i].teams[j].players[k].hasOwnProperty("pm")) {
                                leagueFile.games[i].teams[j].players[k].pm = 0;
                            }
                        }
                    }
                }
            }

            // These object stores are blank by default
            toMaybeAdd = ["releasedPlayers", "awards", "schedule", "playoffSeries", "negotiations", "messages", "games", "events", "playerFeats"];
            for (j = 0; j < toMaybeAdd.length; j++) {
                if (leagueFile.hasOwnProperty(toMaybeAdd[j])) {
                    for (i = 0; i < leagueFile[toMaybeAdd[j]].length; i++) {
                        tx[toMaybeAdd[j]].add(leagueFile[toMaybeAdd[j]][i]);
                    }
                }
            }

            return player.genBaseMoods(tx).then(baseMoods => {
                let agingYears, baseRatings, draftYear, goodNeutralBad, i, n, p, playerTids, players, pots, profile, profiles, t, t2;

                // Either add players from league file or generate them

                if (leagueFile.hasOwnProperty("players")) {
                    // Use pre-generated players, filling in attributes as needed
                    players = leagueFile.players;

                    // Does the player want the rosters randomized?
                    if (randomizeRosters) {
                        // Assign the team ID of all players to the 'playerTids' array.
                        // Check tid to prevent draft prospects from being swapped with established players
                        playerTids = _.pluck(players.filter(p => p.tid >= g.PLAYER.FREE_AGENT), "tid");

                        // Shuffle the teams that players are assigned to.
                        random.shuffle(playerTids);
                        for (i = 0; i < players.length; i++) {
                            if (players[i].tid >= g.PLAYER.FREE_AGENT) {
                                players[i].tid = playerTids.pop();
                                if (players[i].stats && players[i].stats.length > 0) {
                                    players[i].stats[players[i].stats.length - 1].tid = players[i].tid;
                                    players[i].statsTids.push(players[i].tid);
                                }
                            }
                        }
                    }

                    players.forEach(p => {
                        let playerStats;

                        p = player.augmentPartialPlayer(p, scoutingRank);

                        // Don't let imported contracts be created for below the league minimum, and round to nearest $10,000.
                        p.contract.amount = Math.max(10 * helpers.round(p.contract.amount / 10), g.minContract);

                        // Separate out stats
                        playerStats = p.stats;
                        delete p.stats;

                        player.updateValues(tx, p, playerStats.reverse()).then(p => {
                            tx.players.put(p).then(pid => {
                                let addStatsRows;

                                // When adding a player, this is the only way to know the pid
                                p.pid = pid;

                                // If no stats in League File, create blank stats rows for active players if necessary
                                if (playerStats.length === 0) {
                                    if (p.tid >= 0 && g.phase <= g.PHASE.PLAYOFFS) {
                                        // Needs pid, so must be called after put. It's okay, statsTid was already set in player.augmentPartialPlayer
                                        p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);
                                    }
                                } else {
                                    // If there are stats in the League File, add them to the database
                                    addStatsRows = () => {
                                        let ps;

                                        ps = playerStats.pop();

                                        // Augment with pid, if it's not already there - can't be done in player.augmentPartialPlayer because pid is not known at that point
                                        ps.pid = p.pid;

                                        // Could be calculated correctly if I wasn't lazy
                                        if (!ps.hasOwnProperty("yearsWithTeam")) {
                                            ps.yearsWithTeam = 1;
                                        }

                                        // If needed, set missing +/-, blocks against to 0
                                        if (!ps.hasOwnProperty("ba")) {
                                            ps.ba = 0;
                                        }
                                        if (!ps.hasOwnProperty("pm")) {
                                            ps.pm = 0;
                                        }

                                        // Delete psid because it can cause problems due to interaction addStatsRow above
                                        delete ps.psid;

                                        tx.playerStats.add(ps).then(() => {
                                            // On to the next one
                                            if (playerStats.length > 0) {
                                                addStatsRows();
                                            }
                                        });
                                    };
                                    addStatsRows();
                                }
                            });
                        });
                    });
                } else {
                    // No players in league file, so generate new players
                    profiles = ["Point", "Wing", "Big", ""];
                    baseRatings = [37, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 26, 26, 26];
                    pots = [75, 65, 55, 55, 60, 50, 70, 40, 55, 50, 60, 60, 45, 45];

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

                            // Hack to account for player.addStatsRow being called after tx.players.put - manually assign statsTids
                            if (p.tid >= 0) {
                                p.statsTids = [p.tid];
                            }

                            // Update player values after ratings changes
                            player.updateValues(tx, p, []).then(p => {
                                let randomizeExp;

                                // Randomize contract expiration for players who aren't free agents, because otherwise contract expiration dates will all be synchronized
                                randomizeExp = (p.tid !== g.PLAYER.FREE_AGENT);

                                // Update contract based on development. Only write contract to player log if not a free agent.
                                p = player.setContract(p, player.genContract(p, randomizeExp), p.tid >= 0);

                                // Save to database
                                if (p.tid === g.PLAYER.FREE_AGENT) {
                                    player.addToFreeAgents(tx, p, null, baseMoods);
                                } else {
                                    tx.players.put(p).then(pid => {
                                        // When adding a player, this is the only way to know the pid
                                        p.pid = pid;

                                        // Needs pid, so must be called after put. It's okay, statsTid was already set above
                                        p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);
                                    });
                                }
                            });
                        }

                        // Initialize rebuilding/contending, when possible
                        if (t2 >= 0) {
                            ((goodNeutralBad => {
                                tx.teams.get(t2).then(t => {
                                    t.strategy = goodNeutralBad === 1 ? "contending" : "rebuilding";
                                    tx.teams.put(t);
                                });
                            })(goodNeutralBad));
                        }
                    }
                }

                return players;
            });
        }).then(players => {
            let createUndrafted1, createUndrafted2, createUndrafted3, i;

            // Use a new transaction so there is no race condition with generating draft prospects and regular players (PIDs can seemingly collide otherwise, if it's an imported roster)
            return g.dbl.tx(["players", "playerStats"], "readwrite", tx => {
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
                // If the draft has already happened this season but next year's class hasn't been bumped up, don't create any g.PLAYER.UNDRAFTED
                if (createUndrafted1 && (g.phase <= g.PHASE.BEFORE_DRAFT || g.phase >= g.PHASE.FREE_AGENCY)) {
                    draft.genPlayers(tx, g.PLAYER.UNDRAFTED, scoutingRank, createUndrafted1);
                }
                if (createUndrafted2) {
                    draft.genPlayers(tx, g.PLAYER.UNDRAFTED_2, scoutingRank, createUndrafted2);
                }
                if (createUndrafted3) {
                    draft.genPlayers(tx, g.PLAYER.UNDRAFTED_3, scoutingRank, createUndrafted3);
                }

                // Donald Trump Easter Egg
                if (Math.random() < 0.01) {
                    tx.players.put({
                        tid: -2,
                        statsTids: [],
                        rosterOrder: 666,
                        ratings: [
                            {
                                hgt: 30,
                                stre: 100,
                                spd: 90,
                                jmp: 90,
                                endu: 90,
                                ins: 90,
                                dnk: 90,
                                ft: 90,
                                fg: 90,
                                tp: 90,
                                blk: 100,
                                stl: 100,
                                drb: 90,
                                pss: 0,
                                reb: 90,
                                season: startingSeason,
                                ovr: 75,
                                pot: 75,
                                fuzz: 0,
                                skills: ["Dp"],
                                pos: "G"
                            }
                        ],
                        weight: 198,
                        hgt: 75,
                        born: {
                            year: 1946,
                            loc: "Queens, NY"
                        },
                        name: "Donald Trump",
                        college: "",
                        imgURL: "//play.basketball-gm.com/img/trump.jpg",
                        awards: [],
                        freeAgentMood: [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        yearsFreeAgent: 0,
                        retiredYear: null,
                        draft: {
                            round: 0,
                            pick: 0,
                            tid: -1,
                            originalTid: -1,
                            year: startingSeason,
                            teamName: null,
                            teamRegion: null,
                            pot: 75,
                            ovr: 75,
                            skills: ["Dp"]
                        },
                        face: {
                            head: {
                                id: 0
                            },
                            eyebrows: [
                                {
                                    id: 0,
                                    lr: "l",
                                    cx: 135,
                                    cy: 250
                                },
                                {
                                    id: 0,
                                    lr: "r",
                                    cx: 265,
                                    cy: 250
                                }
                            ],
                            eyes: [
                                {
                                    id: 3,
                                    lr: "l",
                                    cx: 135,
                                    cy: 280,
                                    angle: -2.53978886641562
                                },
                                {
                                    id: 3,
                                    lr: "r",
                                    cx: 265,
                                    cy: 280,
                                    angle: -2.53978886641562
                                }
                            ],
                            nose: {
                                id: 1,
                                lr: "l",
                                cx: 200,
                                cy: 330,
                                size: 0.46898400504142046,
                                flip: true
                            },
                            mouth: {
                                id: 3,
                                cx: 200,
                                cy: 400
                            },
                            hair: {
                                id: 0
                            },
                            fatness: 0.07551302784122527,
                            color: "#a67358"
                        },
                        injury: {
                            type: "Healthy",
                            gamesRemaining: 0
                        },
                        ptModifier: 1,
                        hof: false,
                        watch: false,
                        gamesUntilTradable: 0,
                        value: 85.32267878968268,
                        valueNoPot: 79,
                        valueFuzz: 86.69999999999999,
                        valueNoPotFuzz: 81,
                        valueWithContract: 85.32267878968268,
                        salaries: [],
                        contract: {
                            amount: 500,
                            exp: startingSeason + 1
                        }
                    });
                }
            }).then(() => {
                let lid;

                if (skipNewPhase) {
                    // Game already in progress, just start it
                    return g.lid;
                }

                ui.updatePhase(`${g.season} ${g.PHASE_TEXT[g.phase]}`);
                ui.updateStatus("Idle");

                lid = g.lid; // Otherwise, g.lid can be overwritten before the URL redirects, and then we no longer know the league ID

                helpers.bbgmPing("league");

                // Auto sort rosters
                return g.dbl.tx("players", "readwrite", tx => Promise.map(teams, t => team.rosterAutoSort(tx, t.tid)).then(() => lid));
            });
        });
    });
}

/**
 * Delete an existing league.
 *
 * @memberOf core.league
 * @param {number} lid League ID.
 * @param {function()=} cb Optional callback.
 */
function remove(lid) {
    return new Promise((resolve, reject) => {
        let request;

        if (g.dbl !== undefined) {
            g.dbl.close();
        }

        g.dbm.leagues.delete(lid);
        request = indexedDB.deleteDatabase(`league${lid}`);
        request.onsuccess = () => {
            resolve();
        };
        request.onfailure = event => {
            reject(event);
        };
        request.onblocked = () => {
            // Necessary because g.dbl.close() doesn't always finish in time and
            // http://www.w3.org/TR/IndexedDB/#dfn-steps-for-deleting-a-database
            // says it will still be deleted even if onblocked fires.
            resolve();
        };
    });
}


/**
 * Export existing active league.
 *
 * @memberOf core.league
 * @param {string[]} stores Array of names of objectStores to include in export
 * @return {Promise} Resolve to all the exported league data.
 */
function exportLeague(stores) {
    let exportedLeague;

    exportedLeague = {};

    // Row from leagueStore in meta db.
    // phaseText is needed if a phase is set in gameAttributes.
    // name is only used for the file name of the exported roster file.
    exportedLeague.meta = {phaseText: g.phaseText, name: g.leagueName};

    return Promise.map(stores, store => g.dbl[store].getAll().then(contents => {
        exportedLeague[store] = contents;
    })).then(() => {
        // Move playerStats to players object, similar to old DB structure. Makes editing JSON output nicer.
        let i, j, pid, tid;

        if (stores.indexOf("playerStats") >= 0) {
            for (i = 0; i < exportedLeague.playerStats.length; i++) {
                pid = exportedLeague.playerStats[i].pid;

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
        }

        if (stores.indexOf("teams") >= 0) {
            for (i = 0; i < exportedLeague.teamSeasons.length; i++) {
                tid = exportedLeague.teamSeasons[i].tid;

                for (j = 0; j < exportedLeague.teams.length; j++) {
                    if (exportedLeague.teams[j].tid === tid) {
                        if (!exportedLeague.teams[j].hasOwnProperty("seasons")) {
                            exportedLeague.teams[j].seasons = [];
                        }
                        exportedLeague.teams[j].seasons.push(exportedLeague.teamSeasons[i]);
                        break;
                    }
                }
            }
            for (i = 0; i < exportedLeague.teamStats.length; i++) {
                tid = exportedLeague.teamStats[i].tid;

                for (j = 0; j < exportedLeague.teams.length; j++) {
                    if (exportedLeague.teams[j].tid === tid) {
                        if (!exportedLeague.teams[j].hasOwnProperty("stats")) {
                            exportedLeague.teams[j].stats = [];
                        }
                        exportedLeague.teams[j].stats.push(exportedLeague.teamStats[i]);
                        break;
                    }
                }
            }

            delete exportedLeague.teamSeasons;
            delete exportedLeague.teamStats;
        }
    }).then(() => exportedLeague);
}

function updateMetaNameRegion(name, region) {
    return g.dbm.leagues.get(g.lid).then(l => {
        l.teamName = name;
        l.teamRegion = region;
        return g.dbm.leagues.put(l);
    });
}

/**
 * Load a game attribute from the database and update the global variable g.
 *
 * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
 * @param {string} key Key in gameAttributes to load the value for.
 * @return {Promise}
 */
function loadGameAttribute(ot, key) {
    const dbOrTx = ot !== null ? ot : g.dbl;
    return dbOrTx.gameAttributes.get(key).then(gameAttribute => {
        if (gameAttribute === undefined) {
            throw new Error(`Unknown game attribute: ${key}`);
        }

        g[key] = gameAttribute.value;

        // UI stuff - see also loadGameAttributes
        if (key === "godMode") {
            g.vm.topMenu.godMode(g.godMode);
        }
        if (key === "userTid" || key === "userTids") {
            g.vm.multiTeam[key](gameAttribute.value);
        }

        // Set defaults to avoid IndexedDB upgrade
        if (g[key] === undefined && defaultGameAttributes.hasOwnProperty(key)) {
            g[key] = defaultGameAttributes[key];
        }
    });
}

/**
 * Load game attributes from the database and update the global variable g.
 *
 * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
 * @return {Promise}
 */
function loadGameAttributes(ot) {
    const dbOrTx = ot !== null ? ot : g.dbl;

    return dbOrTx.gameAttributes.getAll().then(gameAttributes => {
        let i;

        for (i = 0; i < gameAttributes.length; i++) {
            g[gameAttributes[i].key] = gameAttributes[i].value;
        }

        // Shouldn't be necessary, but some upgrades fail http://www.reddit.com/r/BasketballGM/comments/2zwg24/cant_see_any_rosters_on_any_teams_in_any_of_my/cpn0j6w
        if (g.userTids === undefined) { g.userTids = [g.userTid]; }

        // Set defaults to avoid IndexedDB upgrade
        Object.keys(defaultGameAttributes).forEach(key => {
            if (g[key] === undefined) {
                g[key] = defaultGameAttributes[key];
            }
        });

        // UI stuff - see also loadGameAttribute
        g.vm.topMenu.godMode(g.godMode);
        g.vm.multiTeam.userTid(g.userTid);
        g.vm.multiTeam.userTids(g.userTids);
    });
}

// Depending on phase, initiate action that will lead to the next phase
function autoPlay() {
    let freeAgents, game, season;
    freeAgents = require('./freeAgents');
    game = require('./game');
    season = require('./season');

    if (g.phase === g.PHASE.PRESEASON) {
        return phase.newPhase(g.PHASE.REGULAR_SEASON);
    }
    if (g.phase === g.PHASE.REGULAR_SEASON) {
        return season.getDaysLeftSchedule().then(game.play);
    }
    if (g.phase === g.PHASE.PLAYOFFS) {
        return game.play(100);
    }
    if (g.phase === g.PHASE.BEFORE_DRAFT) {
        return phase.newPhase(g.PHASE.DRAFT);
    }
    if (g.phase === g.PHASE.DRAFT) {
        return draft.untilUserOrEnd();
    }
    if (g.phase === g.PHASE.AFTER_DRAFT) {
        return phase.newPhase(g.PHASE.RESIGN_PLAYERS);
    }
    if (g.phase === g.PHASE.RESIGN_PLAYERS) {
        return phase.newPhase(g.PHASE.FREE_AGENCY);
    }
    if (g.phase === g.PHASE.FREE_AGENCY) {
        return freeAgents.play(g.daysLeft);
    }
}

function initAutoPlay() {
    let numSeasons, result;

    result = window.prompt("This will play through multiple seasons, using the AI to manage your team. How many seasons do you want to simulate?", "5");
    numSeasons = parseInt(result, 10);

    if (Number.isInteger(numSeasons)) {
        setGameAttributesComplete({autoPlaySeasons: numSeasons})
            .then(autoPlay);
    }
}

module.exports = {
    create,
    exportLeague,
    remove,
    setGameAttributes,
    setGameAttributesComplete,
    updateMetaNameRegion,
    loadGameAttribute,
    loadGameAttributes,
    updateLastDbChange,
    autoPlay,
    initAutoPlay
};
