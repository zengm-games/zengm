/**
 * @name core.freeAgents
 * @namespace Functions related to free agents that didn't make sense to put anywhere else.
 */
define(["db", "util/random"], function (db, random) {
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

                // Run callback when all teams have had a turn to sign players
                if (ti === tids.length) {
                    cb();
                    return;
                }

                db.getNumPlayersOnRoster(transaction, tid, function (numPlayersOnRoster) {
                    db.getPayroll(transaction, tid, function (payroll) {
                        var i, newPlayer, p;

                        newPlayer = false;

                        if (payroll < g.salaryCap && numPlayersOnRoster < 15) {
                            for (i = 0; i < players.length; i++) {
                                if (players[0].contractAmount + payroll <= g.salaryCap) {
                                    p = players.shift();
                                    p.tid = tid;
                                    db.putPlayer(transaction, p);
                                    newPlayer = true;
                                }
                            }
                        }

                        if (newPlayer) {
                            db.rosterAutoSort(transaction, tid);
                        }

                        if (ti <= tids.length) {
                            signTeam(ti + 1);
                        }
                    });
                });
            };

            signTeam(0);

/*                r = g.dbex("SELECT count(*) FROM playerAttributes WHERE tid = :tid", tid=tid);
                numPlayers, = r.fetchone();
                payroll = getPayroll(tid);
                while payroll < g.salaryCap and numPlayers < 15) {
                    j = 0;
                    newPlayer = false;
                    for pid, amount, expiration, signed in freeAgents) {
                        if (amount + payroll <= g.salaryCap and not signed and numPlayers < 15) {
                            g.dbex("UPDATE playerAttributes SET tid = :tid, contractAmount = :contractAmount, contractExp = :contractExp WHERE pid = :pid", tid=tid, contractAmount=amount, contractExp=expiration, pid=pid);
                            freeAgents[j][-1] = true;  // Mark player signed
                            newPlayer = true;
                            numPlayers += 1;
                            payroll += amount;
                            rosterAutoSort(tid);
                        j += 1;
                    if (not newPlayer) {
                        break;*/
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