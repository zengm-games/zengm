/**
 * @name core.contractNegotiation
 * @namespace All aspects of contract negotiation.
 */
define(["db", "globals", "ui", "core/freeAgents", "core/player", "util/helpers", "util/lock", "util/random"], function (db, g, ui, freeAgents, player, helpers, lock, random) {
    "use strict";

    /**
     * Start a new contract negotiation with a player.
     *
     * If ot is null, then the callback will run only after the transaction finishes (i.e. only after the new negotiation is actually saved to the database). If ot is not null, then the callback might run earlier, so don't rely on the negotiation actually being in the database yet.
     *
     * So, ot should NOT be null if you're starting multiple negotiations as a component of some larger operation, but the presence of a particular negotiation in the database doesn't matter. ot should be null if you need to ensure that the roster order is updated before you do something that will read the roster order (like updating the UI). (WARNING: This means that there is actually a race condition for when this is called from season.newPhaseResignPlayers is the UI is updated before the user's teams negotiations are all saved to the database! In practice, this doesn't seem to be a problem now, but it could be eventually.)
     *
     * @memberOf core.contractNegotiation
     * @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes, messages, negotiations, and players, readwrite; if null is passed, then a new transaction will be used.
     * @param {number} pid An integer that must correspond with the player ID of a free agent.
     * @param {boolean} resigning Set to true if this is a negotiation for a contract extension, which will allow multiple simultaneous negotiations. Set to false otherwise.
     * @param {function(string=)} cb Callback to be run only after a successful negotiation is started. If an error occurs, pass a string error message.
     */
    function create(ot, pid, resigning, cb) {
        var success, tx;

        console.log("Trying to start new contract negotiation with player " + pid);
        success = false;

        if ((g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.AFTER_DRAFT) && !resigning) {
            return cb("You're not allowed to sign free agents now.");
        }

        tx = db.getObjectStore(ot, ["gameAttributes", "messages", "negotiations", "players"], null, true);

        lock.canStartNegotiation(tx, function (canStartNegotiation) {
            var playerStore;

            if (!canStartNegotiation) {
                return cb("You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");
            }

            playerStore = tx.objectStore("players");
            playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                var numPlayersOnRoster;

                numPlayersOnRoster = event.target.result.length;
                if (numPlayersOnRoster >= 15 && !resigning) {
                    return cb("Your roster is full. Before you can sign a free agent, you'll have to buy out or release one of your current players.");
                }

                playerStore.get(pid).onsuccess = function (event) {
                    var negotiation, p, playerAmount, playerYears;

                    p = event.target.result;
                    if (p.tid !== g.PLAYER.FREE_AGENT) {
                        return cb(p.name + " is not a free agent.");
                    }

                    // Initial player proposal;
                    playerAmount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);
                    playerYears = p.contract.exp - g.season;
                    // Adjust to account for in-season signings;
                    if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
                        playerYears += 1;
                    }

                    if (freeAgents.refuseToNegotiate(playerAmount, p.freeAgentMood[g.userTid])) {
                        return cb(p.name + " refuses to sign with you, no matter what you offer.");
                    }

                    negotiation = {
                        pid: pid,
                        team: {amount: playerAmount, years: playerYears},
                        player: {amount: playerAmount, years: playerYears},
                        orig: {amount: playerAmount, years: playerYears},
                        resigning: resigning
                    };

                    tx.objectStore("negotiations").add(negotiation).onsuccess = function () {
                        success = true;
                        if (ot !== null) {
                            // This function doesn't have its own transaction, so we need to call the callback now even though the update and add might not have been processed yet (this will keep the transaction alive).
                            if (cb !== undefined) {
                                ui.updateStatus("Contract negotiation in progress...");
                                ui.updatePlayMenu(tx, cb);
                            }
                        }
                    };
                };
            };
        });

        if (ot === null) {
            // This function has its own transaction, so wait until it finishes before calling the callback.
            tx.oncomplete = function () {
                if (success) {
                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                        ui.updateStatus("Contract negotiation in progress...");
                        ui.updatePlayMenu(null, cb);
                    });
                }
            };
        }
    }

    /**
     * Restrict the input to between g.minContract and g.maxContract, the valid amount of annual thousands of dollars for a contract.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} years Annual salary, in thousands of dollars, to be validated.
     * @return {number} An integer between g.minContract and g.maxContract, rounded to the nearest $10k.
     */
    function validAmount(amount) {
        if (amount < g.minContract) {
            amount = g.minContract;
        } else if (amount > g.maxContract) {
            amount = g.maxContract;
        }
        return helpers.round(amount / 10) * 10;
    }

    /**
     * Restrict the input to between 1 and 5, the valid number of years for a contract.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} years Number of years, to be validated.
     * @return {number} An integer between 1 and 5.
     */
    function validYears(years) {
        if (years < 1) {
            years = 1;
        } else if (years > 5) {
            years = 5;
        }
        return Math.round(years);
    }

    /**
     * Make an offer to a player.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
     * @param {number} teamAmount Teams's offer amount in thousands of dollars per year (between 500 and 20000).
     * @param {number} teamYears Team's offer length in years (between 1 and 5).
     * @param {function()=} cb Optional callback.
     */
    function offer(pid, teamAmount, teamYears, cb) {
        var i, negotiation, negotiations, tx;

        console.log("User made contract offer for " + teamAmount + " over " + teamYears + " years to " + pid);

        teamAmount = validAmount(teamAmount);
        teamYears = validYears(teamYears);

        tx = g.dbl.transaction(["negotiations", "players"], "readwrite");
        tx.objectStore("players").openCursor(pid).onsuccess = function (event) {
            var cursor, mood, p;

            cursor = event.target.result;
            p = cursor.value;

            mood = p.freeAgentMood[g.userTid];
            p.freeAgentMood[g.userTid] += random.uniform(0, 0.15);
            if (p.freeAgentMood[g.userTid] > 1) {
                p.freeAgentMood[g.userTid] = 1;
            }

            cursor.update(p);

            tx.objectStore("negotiations").openCursor(pid).onsuccess = function (event) {
                var cursor, diffPlayerOrig, diffTeamOrig, negotiation;

                cursor = event.target.result;
                negotiation = cursor.value;

                // Player responds based on their mood
                if (negotiation.orig.amount >= 18000) {
                    // Expensive guys don't negotiate
                    negotiation.player.amount *= 1 + 0.05 * mood;
                } else {
                    if (teamYears === negotiation.player.years) {
                        // Team and player agree on years, so just update amount
                        if (teamAmount >= negotiation.player.amount) {
                            negotiation.player.amount = teamAmount;
                        } else if (teamAmount > 0.7 * negotiation.player.amount) {
                            negotiation.player.amount = (0.5 * (1 + mood)) * negotiation.orig.amount + (0.5 * (1 - mood)) * teamAmount;
                        } else {
                            negotiation.player.amount *= 1.05;
                        }
                    } else if ((teamYears > negotiation.player.years && negotiation.orig.years > negotiation.player.years) || (teamYears < negotiation.player.years && negotiation.orig.years < negotiation.player.years)) {
                        // Team moves years closer to original value

                        // Update years
                        diffPlayerOrig = negotiation.player.years - negotiation.orig.years;
                        diffTeamOrig = teamYears - negotiation.orig.years;
                        if (diffPlayerOrig > 0 && diffTeamOrig > 0) {
                            // Team moved towards player's original years without overshooting
                            negotiation.player.years = teamYears;
                        } else {
                            // Team overshot original years
                            negotiation.player.years = negotiation.orig.years;
                        }

                        // Update amount
                        if (teamAmount > negotiation.player.amount) {
                            negotiation.player.amount = teamAmount;
                        } else if (teamAmount > 0.85 * negotiation.player.amount) {
                            negotiation.player.amount = (0.5 * (1 + mood)) * negotiation.orig.amount + (0.5 * (1 - mood)) * teamAmount;
                        } else {
                            negotiation.player.amount *= 1.05;
                        }
                    } else {
                        // Team move years further from original value
                        if (teamAmount > 1.1 * negotiation.player.amount) {
                            negotiation.player.amount = teamAmount;
                            if (teamYears > negotiation.player.years) {
                                negotiation.player.years += 1;
                            } else {
                                negotiation.player.years -= 1;
                            }
                        } else if (teamAmount > 0.9 * negotiation.player.amount) {
                            negotiation.player.amount *= 1.15;
                            if (teamYears > negotiation.player.years) {
                                negotiation.player.years += 1;
                            } else {
                                negotiation.player.years -= 1;
                            }
                        } else {
                            negotiation.player.amount *= 1.15;
                        }
                    }

                    // General punishment from angry players
                    if (mood > 0.25) {
                        negotiation.player.amount *= 1 + 0.1 * mood;
                    }
                }

                negotiation.player.amount = validAmount(negotiation.player.amount);
                negotiation.player.years = validYears(negotiation.player.years);

                negotiation.team.amount = teamAmount;
                negotiation.team.years = teamYears;

                cursor.update(negotiation);
            };
        };
        tx.oncomplete = function () {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                if (cb !== undefined) {
                    cb();
                }
            });
        };
    }

    /**
     * Cancel contract negotiations with a player.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
     * @param {function()} cb Callback.
     */
    function cancel(pid, cb) {
        var i, negotiations;

        console.log("User canceled contract negotiations with " + pid);

        // Delete negotiation
        g.dbl.transaction("negotiations", "readwrite").objectStore("negotiations").delete(pid).onsuccess = function (event) {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                // If no negotiations are in progress, update status
                lock.negotiationInProgress(null, function (negotiationInProgress) {
                    if (!negotiationInProgress) {
                        ui.updateStatus("Idle");
                        ui.updatePlayMenu();
                    }

                    cb();
                });
            });
        };
    }

    /**
     * Cancel all ongoing contract negotiations.
     * 
     * Currently, the only time there should be multiple ongoing negotiations in the first place is when a user is resigning players at the end of the season, although that should probably change eventually.
     * 
     * @memberOf core.contractNegotiation
     * @param {function()=} cb Optional callback.
     */
    function cancelAll(cb) {
        var i, negotiations;

        console.log("Canceling all ongoing contract negotiations...");

        g.dbl.transaction("negotiations", "readwrite").objectStore("negotiations").clear().onsuccess = function (event) {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                ui.updateStatus("Idle");
                ui.updatePlayMenu(null, cb);
            });
        };
    }

    /**
     * Accept the player's offer.
     * 
     * If successful, then the team's current roster will be displayed.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
     * @param {function(string=)} cb Callback to be run only after the contract is successfully accepted. If an error occurs, pass a string error message.
     */
    function accept(pid, cb) {
        g.dbl.transaction("negotiations").objectStore("negotiations").get(pid).onsuccess = function (event) {
            var negotiation;

            negotiation = event.target.result;

            // If this contract brings team over the salary cap, it"s not a minimum;
            // contract, and it's not resigning a current player, ERROR!;
            db.getPayroll(null, g.userTid, function (payroll) {
                var tx;

                if (!negotiation.resigning && (payroll + negotiation.player.amount > g.salaryCap && negotiation.player.amount !== g.minContract)) {
                    return cb("This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract, buy out a player currently on your roster, or cancel the negotiation.");
                }

                // Adjust to account for in-season signings;
                if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
                    negotiation.player.years -= 1;
                }

/*                r = g.dbex("SELECT MAX(rosterOrder) + 1 FROM playerAttributes WHERE tid = :tid", tid = g.userTid);
                rosterOrder, = r.fetchone();*/

                tx = g.dbl.transaction("players", "readwrite");
                tx.objectStore("players").openCursor(pid).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;

                    // Handle stats if the season is in progress
                    p.tid = g.userTid;
                    if (g.phase <= g.PHASE.PLAYOFFS) { // Resigning your own players happens after this
                        p = player.addStatsRow(p);
                    }
                    p = player.setContract(p, {
                        amount: negotiation.player.amount,
                        exp: g.season + negotiation.player.years
                    }, true);

                    cursor.update(p);
                };
                tx.oncomplete = function () {
                    cancel(pid, function () {
                        console.log("User accepted contract proposal from " + pid);

                        db.setGameAttributes({lastDbChange: Date.now()}, function () {
                            cb();
                        });
                    });
                };
            });
        };
    }

    return {
        accept: accept,
        cancel: cancel,
        cancelAll: cancelAll,
        create: create,
        offer: offer
    };
});