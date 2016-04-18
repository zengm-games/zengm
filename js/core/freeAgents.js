const g = require('../globals');
const ui = require('../ui');
const player = require('./player');
const team = require('./team');
const Promise = require('bluebird');
const _ = require('underscore');
const eventLog = require('../util/eventLog');
const helpers = require('../util/helpers');
const lock = require('../util/lock');
const random = require('../util/random');

/**
 * AI teams sign free agents.
 *
 * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
function autoSign(tx) {
    return helpers.maybeReuseTx(["players", "playerStats", "releasedPlayers", "teams", "teamSeasons", "teamStats"], "readwrite", tx, tx => Promise.all([
        team.filter({
            ot: tx,
            attrs: ["strategy"],
            season: g.season
        }),
        tx.players.index('tid').getAll(g.PLAYER.FREE_AGENT)
    ]).spread((teams, players) => {
        let i, strategies, tids;

        strategies = _.pluck(teams, "strategy");

        // List of free agents, sorted by value
        players.sort((a, b) => b.value - a.value);

        if (players.length === 0) {
            return;
        }

        // Randomly order teams
        tids = [];
        for (i = 0; i < g.numTeams; i++) {
            tids.push(i);
        }
        random.shuffle(tids);

        return Promise.each(tids, tid => {
            // Skip the user's team
            if (g.userTids.indexOf(tid) >= 0 && g.autoPlaySeasons === 0) {
                return;
            }

            // Small chance of actually trying to sign someone in free agency, gets greater as time goes on
            if (g.phase === g.PHASE.FREE_AGENCY && Math.random() < 0.99 * g.daysLeft / 30) {
                return;
            }

            // Skip rebuilding teams sometimes
            if (strategies[tid] === "rebuilding" && Math.random() < 0.7) {
                return;
            }

/*                        // Randomly don't try to sign some players this day
            while (g.phase === g.PHASE.FREE_AGENCY && Math.random() < 0.7) {
                players.shift();
            }*/

            return Promise.all([
                tx.players.index('tid').count(tid),
                team.getPayroll(tx, tid).get(0)
            ]).spread((numPlayersOnRoster, payroll) => {
                let i, p;

                if (numPlayersOnRoster < 15) {
                    for (i = 0; i < players.length; i++) {
                        // Don't sign minimum contract players to fill out the roster
                        if (players[i].contract.amount + payroll <= g.salaryCap || (players[i].contract.amount === g.minContract && numPlayersOnRoster < 13)) {
                            p = players[i];
                            p.tid = tid;
                            if (g.phase <= g.PHASE.PLAYOFFS) { // Otherwise, not needed until next season
                                p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);
                            }
                            p = player.setContract(p, p.contract, true);
                            p.gamesUntilTradable = 15;

                            eventLog.add(null, {
                                type: "freeAgent",
                                text: `${p.contract.amount / 1000}The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[p.tid], g.season])}">${g.teamNamesCache[p.tid]}</a> signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.name}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
                                showNotification: false,
                                pids: [p.pid],
                                tids: [p.tid]
                            });

                            players.splice(i, 1); // Remove from list of free agents

                            // If we found one, stop looking for this team
                            return tx.players.put(p).then(() => team.rosterAutoSort(tx, tid));
                        }
                    }
                }
            });
        });
    }));
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
    return g.dbl.tx("players", "readwrite", tx => tx.players.index('tid').iterate(g.PLAYER.FREE_AGENT, p => {
        let i;

        // Decrease free agent demands
        p.contract.amount -= 50 * Math.sqrt(g.maxContract / 20000);
        if (p.contract.amount < g.minContract) {
            p.contract.amount = g.minContract;
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

        return p;
    }));
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
 * @param {boolean} start Is this a new request from the user to simulate days (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed. Default true.
 */
function play(numDays, start) {
    let cbNoDays, cbRunDay, phase;

    start = start !== undefined ? start : true;
    phase = require('./phase');

    // This is called when there are no more days to play, either due to the user's request (e.g. 1 week) elapsing or at the end of free agency.
    cbNoDays = () => {
        require('../core/league').setGameAttributesComplete({gamesInProgress: false}).then(() => {
            ui.updatePlayMenu(null).then(() => {
                // Check to see if free agency is over
                if (g.daysLeft === 0) {
                    phase.newPhase(g.PHASE.PRESEASON).then(() => {
                        ui.updateStatus("Idle");
                    });
                }
            });
        });
    };

    // This simulates a day, including game simulation and any other bookkeeping that needs to be done
    cbRunDay = () => {
        let cbYetAnother;

        // This is called if there are remaining days to simulate
        cbYetAnother = () => {
            decreaseDemands().then(() => {
                autoSign().then(() => {
                    require('../core/league').setGameAttributesComplete({daysLeft: g.daysLeft - 1, lastDbChange: Date.now()}).then(() => {
                        if (g.daysLeft > 0 && numDays > 0) {
                            ui.realtimeUpdate(["playerMovement"], undefined, () => {
                                ui.updateStatus(`${g.daysLeft} days left`);
                                play(numDays - 1, false);
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
                    require('../core/league').setGameAttributesComplete({stopGames: false}).then(cbYetAnother);
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
        lock.canStartGames(null).then(canStartGames => {
            if (canStartGames) {
                require('../core/league').setGameAttributesComplete({gamesInProgress: true}).then(() => {
                    ui.updatePlayMenu(null).then(() => {
                        cbRunDay();
                    });
                });
            }
        });
    } else {
        cbRunDay();
    }
}

module.exports = {
    autoSign,
    decreaseDemands,
    amountWithMood,
    refuseToNegotiate,
    play
};
