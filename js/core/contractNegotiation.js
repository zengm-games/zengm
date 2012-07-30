/**
 * @name core.contractNegotiation
 * @namespace All aspects of contract negotiation.
 */
define(["db", "core/player", "util/helpers", "util/lock", "util/playMenu", "util/random"], function (db, player, helpers, lock, playMenu, random) {
    "use strict";

    /*

    Args:
        pid: 
        resigning: A boolean. True if (this is a negotiation for a contract
            extension with a current player who just became a free agent. False
            otherwise.
    */
    /**
     * Start a new contract negotiation with a player.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} pid An integer that must correspond with the player ID of a free agent.
     * @param {boolean}   resigning Set to true if this is a negotiation for a contract extension, which will allow multiple simultaneous negotiations. Set to false otherwise.
     * @param {function()} cb Optional callback to be run only after a successful negotiation is started.
     */
    function create(pid, resigning, cb) {
        var playerStore;

        console.log("Trying to start new contract negotiation with player " + pid);

        if ((g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_AFTER_DRAFT) && !resigning) {
            helpers.leagueError("You're not allowed to sign free agents now.");
            return;
        }
        if (!lock.canStartNegotiation()) {
            helpers.leagueError("You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");
            return;
        }

        playerStore = g.dbl.transaction(["players"], IDBTransaction.READ_WRITE).objectStore("players");
        playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
            var numPlayersOnRoster;

            numPlayersOnRoster = event.target.result.length;
            if (numPlayersOnRoster >= 15 && !resigning) {
                helpers.leagueError("Your roster is full. Before you can sign a free agent, you'll have to buy out or release one of your current players.");
                return;
            }

            playerStore.openCursor(IDBKeyRange.only(pid)).onsuccess = function (event) {
                var cursor, maxOffers, negotiations, player, playerAmount, playerYears;

                cursor = event.target.result;
                player = cursor.value;
                if (player.tid !== c.PLAYER_FREE_AGENT) {
                    helpers.leagueError("Player " + pid + " is not a free agent.");
                    return;
                }

                // Initial player proposal;
                playerAmount = player.contractAmount * (1 + player.freeAgentTimesAsked / 10);
                playerYears = player.contractExp - g.season;
                // Adjust to account for in-season signings;
                if (g.phase <= c.PHASE_AFTER_TRADE_DEADLINE) {
                    playerYears += 1;
                }

                maxOffers = random.randInt(1, 5);

                negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
                negotiations.push({pid: pid, teamAmount: playerAmount, teamYears: playerYears, playerAmount: playerAmount, playerYears: playerYears, numOffersMade: 0, maxOffers: maxOffers, resigning: resigning});
                localStorage.setItem("league" + g.lid + "Negotiations", JSON.stringify(negotiations));
                playMenu.setStatus("Contract negotiation in progress...");
                playMenu.refreshOptions();

                // Keep track of how many times negotiations happen with a player;
                if (!resigning) {
                    player.freeAgentTimesAsked += 1;
                    cursor.update(player);
                }

                if (typeof cb !== "undefined") {
                    cb();
                }
            };
        };
    }

    /**
     * Make an offer to a player.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
     * @param {number} teamAmount Teams's offer amount in thousands of dollars per year (between 500 and 20000).
     * @param {number} teamYears Team's offer length in years (between 1 and 5).
     */
    function offer(pid, teamAmount, teamYears) {
        var i, negotiation, negotiations;

        console.log("User made contract offer for " + teamAmount + " over " + teamYears + " years to " + pid);

        if (teamAmount > 20000) {
            teamAmount = 20000;
        }
        if (teamYears > 5) {
            teamYears = 5;
        }
        if (teamAmount < 500) {
            teamAmount = 500;
        }
        if (teamYears < 1) {
            teamYears = 1;
        }

        negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
        negotiation = null;
        for (i = 0; i < negotiations.length; i++) {
            if (negotiations[i].pid === pid) {
                negotiation = negotiations[i];
                break;
            }
        }

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

        if (negotiation.playerAmount > 20000) {
            negotiation.playerAmount = 20000;
        }
        if (negotiation.playerYears > 5) {
            negotiation.playerYears = 5;
        }

        localStorage.setItem("league" + g.lid + "Negotiations", JSON.stringify(negotiations));
    }

    /**
     * Accept the player's offer.
     * 
     * If successful, then the team's current roster will be displayed.
     * 
     * @memberOf core.contractNegotiation
     * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
     */
    function accept(pid) {
        var i, negotiation, negotiations;

        negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
        negotiation = null;
        for (i = 0; i < negotiations.length; i++) {
            if (negotiations[i].pid === pid) {
                negotiation = negotiations[i];
                break;
            }
        }

        // If this contract brings team over the salary cap, it"s not a minimum;
        // contract, and it's not resigning a current player, ERROR!;
        db.getPayroll(null, g.userTid, function (payroll) {
            if (!negotiation.resigning && (payroll + negotiation.playerAmount > g.salaryCap && negotiation.playerAmount !== 500)) {
                helpers.leagueError("This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract, buy out a player currently on your roster, or cancel the negotiation.");
                return;
            }

            // Adjust to account for in-season signings;
            if (g.phase <= c.PHASE_AFTER_TRADE_DEADLINE) {
                negotiation.playerYears -= 1;
            }

/*            r = g.dbex("SELECT MAX(rosterOrder) + 1 FROM playerAttributes WHERE tid = :tid", tid = g.userTid);
            rosterOrder, = r.fetchone();*/

            g.dbl.transaction(["players"], IDBTransaction.READ_WRITE).objectStore("players").openCursor(IDBKeyRange.only(pid)).onsuccess = function (event) {
                var cursor, p;

                cursor = event.target.result;
                p = cursor.value;

                // Handle stats if the season is in progress
                if (g.phase <= c.PHASE_PLAYOFFS) { // Resigning your own players happens after this
                    p = player.addStatsRow(p, g.userTid);
                }
                p.tid = g.userTid;
                p.contractAmount = negotiation.playerAmount;
                p.contractExp = g.season + negotiation.playerYears;

                cursor.update(p);

                cancel(pid);

                console.log("User accepted contract proposal from " + pid);

                Davis.location.assign(new Davis.Request("/l/" + g.lid + "/roster"));
            };
        });
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

        negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
        for (i = 0; i < negotiations.length; i++) {
            // Delete negotiation
            negotiations.splice(i, 1);
        }
        localStorage.setItem("league" + g.lid + "Negotiations", JSON.stringify(negotiations));

        // If no negotiations are in progress, update status
        if (!lock.negotiationInProgress()) {
            playMenu.setStatus("Idle");
            playMenu.refreshOptions();
        }
    }

    /**
     * Cancel all ongoing contract negotiations.
     * 
     * Currently, the only time there should be multiple ongoing negotiations in the first place is when a user is resigning players at the end of the season, although that should probably change eventually.
     * 
     * @memberOf core.contractNegotiation
     */
    function cancelAll() {
        var i, negotiations;

        console.log("Canceling all ongoing contract negotiations...");

        // If no negotiations are in progress, update status
        negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
        for (i = 0; i < negotiations.length; i++) {
            cancel(negotiations[i].pid);
        }
    }

    return {
        create: create,
        offer: offer,
        accept: accept,
        cancel: cancel,
        cancelAll: cancelAll
    };
});