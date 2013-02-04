/**
 * @name core.contractNegotiation
 * @namespace All aspects of contract negotiation.
 */
define(["db", "ui", "core/player", "util/lock", "util/random"], function (db, ui, player, lock, random) {
    "use strict";

    /**
     * Start a new contract negotiation with a player.
     * 
     * @memberOf core.contractNegotiation
     * @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes, negotiations, and players, readwrite; if null is passed, then a new transaction will be used.
     * @param {number} pid An integer that must correspond with the player ID of a free agent.
     * @param {boolean} resigning Set to true if this is a negotiation for a contract extension, which will allow multiple simultaneous negotiations. Set to false otherwise.
     * @param {function(string=)} cb Callback to be run only after a successful negotiation is started. If an error occurs, pass a string error message.
     */
    function create(ot, pid, resigning, cb) {
        var transaction;

        console.log("Trying to start new contract negotiation with player " + pid);

        if ((g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_AFTER_DRAFT) && !resigning) {
            return cb("You're not allowed to sign free agents now.");
        }

        transaction = db.getObjectStore(ot, ["gameAttributes", "negotiations", "players"], null, true);

        lock.canStartNegotiation(transaction, function (canStartNegotiation) {
            var playerStore;

            if (!canStartNegotiation) {
                return cb("You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");
            }

            playerStore = transaction.objectStore("players");
            playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                var numPlayersOnRoster;

                numPlayersOnRoster = event.target.result.length;
                if (numPlayersOnRoster >= 15 && !resigning) {
                    return cb("Your roster is full. Before you can sign a free agent, you'll have to buy out or release one of your current players.");
                }

                playerStore.openCursor(pid).onsuccess = function (event) {
                    var cursor, maxOffers, negotiations, player, playerAmount, playerYears;

                    cursor = event.target.result;
                    player = cursor.value;
                    if (player.tid !== c.PLAYER_FREE_AGENT) {
                        return cb("Player " + pid + " is not a free agent.");
                    }

                    // Initial player proposal;
                    playerAmount = player.contractAmount * (1 + player.freeAgentTimesAsked / 10);
                    playerYears = player.contractExp - g.season;
                    // Adjust to account for in-season signings;
                    if (g.phase <= c.PHASE_AFTER_TRADE_DEADLINE) {
                        playerYears += 1;
                    }

                    maxOffers = random.randInt(1, 5);

                    // Keep track of how many times negotiations happen with a player;
                    if (!resigning) {
                        player.freeAgentTimesAsked += 1;
                        cursor.update(player);
                    }

                    transaction.objectStore("negotiations").add({pid: pid, teamAmount: playerAmount, teamYears: playerYears, playerAmount: playerAmount, playerYears: playerYears, numOffersMade: 0, maxOffers: maxOffers, resigning: resigning}).onsuccess = function (event) {
                        ui.updateStatus("Contract negotiation in progress...");
                        ui.updatePlayMenu(transaction, cb);
                    };
                };
            };
        });
    }

    /**
     * Restrict the input to between 500 and 20000, the valid amount of annual thousands of dollars for a contract.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} years Annual salary, in thousands of dollars, to be validated.
     * @return {number} An integer between 500 and 20000.
     */
    function validAmount(amount) {
        if (amount < 500) {
            amount = 500;
        } else if (amount > 20000) {
            amount = 20000;
        }
        return Math.round(amount);
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
        var i, negotiation, negotiations;

        console.log("User made contract offer for " + teamAmount + " over " + teamYears + " years to " + pid);

        teamAmount = validAmount(teamAmount);
        teamYears = validYears(teamYears);

        g.dbl.transaction("negotiations", "readwrite").objectStore("negotiations").openCursor(pid).onsuccess = function (event) {
            var cursor, negotiation;

            cursor = event.target.result;
            negotiation = cursor.value;

            negotiation.numOffersMade += 1;
            if (negotiation.numOffersMade <= negotiation.maxOffers) {
                if (teamYears < negotiation.playerYears) {
                    negotiation.playerYears -= 1;
                    negotiation.playerAmount *= 1.2;
                } else if (teamYears > negotiation.playerYears) {
                    negotiation.playerYears += 1;
                    negotiation.playerAmount *= 1.2;
                }
                if (teamAmount < negotiation.playerAmount && teamAmount > 0.7 * negotiation.playerAmount) {
                    negotiation.playerAmount = 0.75 * negotiation.playerAmount + 0.25 * teamAmount;
                } else if (teamAmount < negotiation.playerAmount) {
                    negotiation.playerAmount *= 1.1;
                }
                if (teamAmount > negotiation.playerAmount) {
                    negotiation.playerAmount = teamAmount;
                }
            } else {
                negotiation.playerAmount = 1.05 * negotiation.playerAmount;
            }

            negotiation.playerAmount = validAmount(negotiation.playerAmount);
            negotiation.playerYears = validYears(negotiation.playerYears);

            negotiation.teamAmount = teamAmount;
            negotiation.teamYears = teamYears;

            cursor.update(negotiation);

            if (cb !== undefined) {
                cb();
            }
        };
    }

    /**
     * Cancel contract negotiations with a player.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
     */
    function cancel(pid) {
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
            ui.updateStatus("Idle");
            ui.updatePlayMenu(null, cb);
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
                if (!negotiation.resigning && (payroll + negotiation.playerAmount > g.salaryCap && negotiation.playerAmount !== 500)) {
                    return cb("This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract, buy out a player currently on your roster, or cancel the negotiation.");
                }

                // Adjust to account for in-season signings;
                if (g.phase <= c.PHASE_AFTER_TRADE_DEADLINE) {
                    negotiation.playerYears -= 1;
                }

    /*            r = g.dbex("SELECT MAX(rosterOrder) + 1 FROM playerAttributes WHERE tid = :tid", tid = g.userTid);
                rosterOrder, = r.fetchone();*/

                g.dbl.transaction(["players"], "readwrite").objectStore("players").openCursor(pid).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;

                    // Handle stats if the season is in progress
                    p.tid = g.userTid;
                    if (g.phase <= c.PHASE_PLAYOFFS) { // Resigning your own players happens after this
                        p = player.addStatsRow(p);
                    }
                    p.contractAmount = negotiation.playerAmount;
                    p.contractExp = g.season + negotiation.playerYears;

                    cursor.update(p);

                    cancel(pid);

                    console.log("User accepted contract proposal from " + pid);

                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                        cb();
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