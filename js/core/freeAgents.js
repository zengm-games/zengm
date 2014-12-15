/**
 * @name core.freeAgents
 * @namespace Functions related to free agents that didn't make sense to put anywhere else.
 */
define(["dao", "db", "globals", "ui", "core/player", "core/team", "lib/bluebird", "lib/underscore", "util/helpers", "util/lock", "util/random"], function (dao, db, g, ui, player, team, Promise, _, helpers, lock, random) {
    "use strict";

    /**
     * AI teams sign free agents.
     * 
     * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
     *
     * @memberOf core.freeAgents
     * @return {Promise}
     */
    function autoSign() {
        return team.filter({
            attrs: ["strategy"],
            season: g.season
        }).then(function (teams) {
            return new Promise(function (resolve, reject) {
                var strategies, tx;

                strategies = _.pluck(teams, "strategy");

                tx = g.dbl.transaction(["players", "playerStats", "releasedPlayers"], "readwrite");

                tx.objectStore("players").index("tid").getAll(g.PLAYER.FREE_AGENT).onsuccess = function (event) {
                    var i, players, signTeam, tids;

                    // List of free agents, sorted by value
                    players = event.target.result;
                    players.sort(function (a, b) { return b.value - a.value; });

                    if (players.length === 0) {
                        resolve();
                        return;
                    }

                    // Randomly order teams
                    tids = [];
                    for (i = 0; i < g.numTeams; i++) {
                        tids.push(i);
                    }
                    random.shuffle(tids);

                    signTeam = function (ti) {
                        var tid;

                        tid = tids[ti];

                        // Run callback when all teams have had a turn to sign players. This extra iteration of signTeam is required in case the user's team is the last one.
                        if (ti === tids.length) {
                            resolve();
                            return;
                        }

                        // Skip the user's team
                        if (tid === g.userTid) {
                            signTeam(ti + 1);
                            return;
                        }

                        // Small chance of actually trying to sign someone in free agency, gets greater as time goes on
                        if (g.phase === g.PHASE.FREE_AGENCY && Math.random() < 0.99 * g.daysLeft / 30) {
                            signTeam(ti + 1);
                            return;
                        }

                        // Skip rebuilding teams sometimes
                        if (strategies[tid] === "rebuilding" && Math.random() < 0.7) {
                            signTeam(ti + 1);
                            return;
                        }

    /*                    // Randomly don't try to sign some players this day
                        while (g.phase === g.PHASE.FREE_AGENCY && Math.random() < 0.7) {
                            players.shift();
                        }*/

                        tx.objectStore("players").index("tid").count(tid).onsuccess = function (event) {
                            var numPlayersOnRoster;

                            numPlayersOnRoster = event.target.result;

                            db.getPayroll(tx, tid, function (payroll) {
                                var afterPickPlayer, i, foundPlayer, p;

                                afterPickPlayer = function (p) {
                                    p = player.setContract(p, p.contract, true);
                                    p.gamesUntilTradable = 15;
                                    dao.players.put({ot: tx, value: p});
                                    team.rosterAutoSort(tx, tid).then(function () {
                                        if (ti <= tids.length) {
                                            signTeam(ti + 1);
                                        }
                                    });
    //console.log(p.tid + ' sign ' + p.name + ' - ' + numPlayersOnRoster);
                                };

                                if (numPlayersOnRoster < 15) {
                                    for (i = 0; i < players.length; i++) {
                                        // Don't sign minimum contract players to fill out the roster
                                        if (players[i].contract.amount + payroll <= g.salaryCap || (players[i].contract.amount === g.minContract && numPlayersOnRoster < 13)) {
                                            p = players[i];
                                            p.tid = tid;
                                            if (g.phase <= g.PHASE.PLAYOFFS) { // Otherwise, not needed until next season
                                                player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS, function (p) {
                                                    afterPickPlayer(p);
                                                });
                                            } else {
                                                afterPickPlayer(p);
                                            }
                                            numPlayersOnRoster += 1;
                                            payroll += p.contract.amount;
                                            foundPlayer = true;
                                            players.splice(i, 1); // Remove from list of free agents
                                            break;  // Only add one free agent
                                        }
                                    }
                                }

                                if (!foundPlayer) {
                                    if (ti <= tids.length) {
                                        signTeam(ti + 1);
                                    }
                                }
                            });
                        };
                    };

                    signTeam(0);
                };
            });
        });
    }

    /**
     * Decrease contract demands for all free agents.
     *
     * This is called after each day in the regular season, as free agents become more willing to take smaller contracts.
     * 
     * @memberOf core.freeAgents
     * @return {Promise}
     */
    function decreaseDemands() {
        return new Promise(function (resolve, reject) {
            var tx;

            tx = g.dbl.transaction("players", "readwrite");
            tx.objectStore("players").index("tid").openCursor(g.PLAYER.FREE_AGENT).onsuccess = function (event) {
                var cursor, i, p;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;

                    // Decrease free agent demands
                    p.contract.amount -= 50;
                    if (p.contract.amount < 500) {
                        p.contract.amount = 500;
                    }

                    if (g.phase !== g.PHASE.FREE_AGENCY) {
                        // Since this is after the season has already started, ask for a short contract
                        if (p.contract.amount < 1000) {
                            p.contract.exp = g.season;
                        } else {
                            p.contract.exp = g.season + 1;
                        }
                    }

                    // Free agents' resistance to signing decays after every regular season game
                    for (i = 0; i < p.freeAgentMood.length; i++) {
                        p.freeAgentMood[i] -= 0.075;
                        if (p.freeAgentMood[i] < 0) {
                            p.freeAgentMood[i] = 0;
                        }
                    }

                    // Also, heal.
                    if (p.injury.gamesRemaining > 0) {
                        p.injury.gamesRemaining -= 1;
                    } else {
                        p.injury = {type: "Healthy", gamesRemaining: 0};
                    }

                    cursor.update(p);
                    cursor.continue();
                }
            };
            tx.oncomplete = function () {
                resolve();
            };
        });
    }

    /**
     * Get contract amount adjusted for mood.
     *
     * @memberOf core.freeAgents
     * @param {number} amount Contract amount, in thousands of dollars or millions of dollars (fun auto-detect!).
     * @param {number} mood Player mood towards a team, from 0 (happy) to 1 (angry).
     * @return {number} Contract amoung adjusted for mood.
     */
    function amountWithMood(amount, mood) {
        amount *= 1 + 0.2 * mood;

        if (amount >= g.minContract) {
            if (amount > g.maxContract) {
                amount = g.maxContract;
            }
            return helpers.round(amount / 10) * 10;  // Round to nearest 10k, assuming units are thousands
        }

        if (amount > g.maxContract / 1000) {
            amount = g.maxContract / 1000;
        }
        return helpers.round(amount * 100) / 100;  // Round to nearest 10k, assuming units are millions
    }

    /**
     * Will a player negotiate with a team, or not?
     * 
     * @param {number} amount Player's desired contract amount, already adjusted for mood as in amountWithMood, in thousands of dollars
     * @param {number} mood Player's mood towards the team in question.
     * @return {boolean} Answer to the question.
     */
    function refuseToNegotiate(amount, mood) {
        if (amount * mood > 10000) {
            return true;
        }

        return false;
    }

    /**
     * Simulates one or more days of free agency.
     * 
     * @memberOf core.freeAgents
     * @param {number} numDays An integer representing the number of days to be simulated. If numDays is larger than the number of days remaining, then all of free agency will be simulated up until the preseason starts.
     * @param {boolean} start Is this a new request from the user to simulate days (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed.
     */
    function play(numDays, start) {
        var cbNoDays, cbRunDay, season;

        start = start !== undefined ? start : false;
        season = require("core/season");

        // This is called when there are no more days to play, either due to the user's request (e.g. 1 week) elapsing or at the end of free agency.
        cbNoDays = function () {
            db.setGameAttributes({gamesInProgress: false}, function () {
                ui.updatePlayMenu(null).then(function () {
                    // Check to see if free agency is over
                    if (g.daysLeft === 0) {
                        season.newPhase(g.PHASE.PRESEASON).then(function () {
                            ui.updateStatus("Idle");
                        });
                    }
                });
            });
        };

        // This simulates a day, including game simulation and any other bookkeeping that needs to be done
        cbRunDay = function () {
            var cbYetAnother;

            // This is called if there are remaining days to simulate
            cbYetAnother = function () {
                decreaseDemands().then(function () {
                    autoSign().then(function () {
                        db.setGameAttributes({daysLeft: g.daysLeft - 1, lastDbChange: Date.now()}, function () {
                            if (g.daysLeft > 0 && numDays > 0) {
                                ui.realtimeUpdate(["playerMovement"], undefined, function () {
                                    ui.updateStatus(g.daysLeft + " days left");
                                    play(numDays - 1);
                                });
                            } else if (g.daysLeft === 0) {
                                cbNoDays();
                            }
                        });
                    });
                });
            };

            if (numDays > 0) {
                // If we didn't just stop games, let's play
                // Or, if we are starting games (and already passed the lock), continue even if stopGames was just seen
                if (start || !g.stopGames) {
                    if (g.stopGames) {
                        db.setGameAttributes({stopGames: false}, cbYetAnother);
                    } else {
                        cbYetAnother();
                    }
                }
            } else if (numDays === 0) {
                // If this is the last day, update play menu
                cbNoDays();
            }
        };

        // If this is a request to start a new simulation... are we allowed to do
        // that? If so, set the lock and update the play menu
        if (start) {
            lock.canStartGames(null).then(function (canStartGames) {
                if (canStartGames) {
                    db.setGameAttributes({gamesInProgress: true}, function () {
                        ui.updatePlayMenu(null).then(function () {
                            cbRunDay();
                        });
                    });
                }
            });
        } else {
            cbRunDay();
        }
    }

    return {
        autoSign: autoSign,
        decreaseDemands: decreaseDemands,
        amountWithMood: amountWithMood,
        refuseToNegotiate: refuseToNegotiate,
        play: play
    };
});