/**
 * @name core.freeAgents
 * @namespace Functions related to free agents that didn't make sense to put anywhere else.
 */
define(["db", "core/player", "util/random"], function (db, player, random) {
    "use strict";

    /**
     * AI teams sign free agents.
     * 
     * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
     *
     * @memberOf core.freeAgents
     * @param {function()} cb Callback.
     */
    function autoSign(cb) {
        var transaction;

        transaction = g.dbl.transaction(["players", "releasedPlayers"], "readwrite");

        transaction.objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
            var i, numPlayersOnRoster, players, signTeam, tids;

            // List of free agents, sorted by value
            players = event.target.result;
            players.sort(function (a, b) {  return (_.last(b.ratings).ovr + 2 * _.last(b.ratings).pot) - (_.last(a.ratings).ovr + 2 * _.last(a.ratings).pot); });

            if (players.length === 0) {
                cb();
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

                // Skip the user's team
                if (tid === g.userTid && ti <= tids.length) {
                    signTeam(ti + 1);
                    return;
                }

                // Run callback when all teams have had a turn to sign players. This extra iteration of signTeam is required in case the user's team is the last one.
                if (ti === tids.length) {
                    cb();
                    return;
                }

                transaction.objectStore("players").index("tid").count(tid).onsuccess = function (event) {
                    var numPlayersOnRoster;

                    numPlayersOnRoster = event.target.result;

                    db.getPayroll(transaction, tid, function (payroll) {
                        var i, foundPlayer, p;

                        if (numPlayersOnRoster < 15) {
                            for (i = 0; i < players.length; i++) {
                                if (players[0].contractAmount + payroll <= g.salaryCap || players[0].contractAmount === g.minContract) {
                                    p = players.shift();
                                    p.tid = tid;
                                    p = player.addStatsRow(p, tid);
                                    db.putPlayer(transaction, p, function () {
                                        db.rosterAutoSort(transaction, tid, function () {
                                            if (ti <= tids.length) {
                                                signTeam(ti + 1);
                                            }
                                        });
                                    });
                                    numPlayersOnRoster += 1;
                                    payroll += p.contractAmount;
                                    foundPlayer = true;
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
    }

    /**
     * Decrease contract demands for all free agents.
     *
     * This is called after each day in the regular season, as free agents become more willing to take smaller contracts.
     * 
     * @memberOf core.freeAgents
     * @param {function()} cb Callback.
     */
    function decreaseDemands(cb) {
        g.dbl.transaction("players", "readwrite").objectStore("players").index("tid").openCursor(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
            var cursor, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;

                // Decrease free agent demands
                p.contractAmount -= 50;
                if (p.contractAmount < 500) {
                    p.contractAmount = 500;
                }
                // Since this is called after the season has already started, ask for a short contract
                if (p.contractAmount < 1000) {
                    p.contractExp = g.season;
                } else {
                    p.contractExp = g.season + 1;
                }

                // Free agents' resistance to previous signing attempts by player decays
                // Decay by 0.1 per game, for 82 games in the regular season
                p.freeAgentTimesAsked -= 0.1;
                if (p.freeAgentTimesAsked < 0) {
                    p.freeAgentTimesAsked = 0;
                }

                cursor.update(p);
                cursor.continue();
            } else {
                cb();
            }
        };
    }

    return {
        autoSign: autoSign,
        decreaseDemands: decreaseDemands
    };
});