import Promise from 'bluebird';
import _ from 'underscore';
import g from '../globals';
import ui from '../ui';
import league from './league';
import phase from './phase';
import player from './player';
import team from './team';
import eventLog from '../util/eventLog';
import helpers from '../util/helpers';
import lock from '../util/lock';
import random from '../util/random';

/**
 * AI teams sign free agents.
 *
 * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
async function autoSign(tx) {
    const objectStores = ["players", "playerStats", "releasedPlayers", "teams", "teamSeasons", "teamStats"];
    await helpers.maybeReuseTx(objectStores, "readwrite", tx, async tx2 => {
        const [teams, players] = await Promise.all([
            team.filter({
                ot: tx2,
                attrs: ["strategy"],
                season: g.season,
            }),
            tx2.players.index('tid').getAll(g.PLAYER.FREE_AGENT),
        ]);

        const strategies = teams.map(t => t.strategy);

        // List of free agents, sorted by value
        players.sort((a, b) => b.value - a.value);

        if (players.length === 0) {
            return;
        }

        // Randomly order teams
        const tids = _.range(g.numTeams);
        random.shuffle(tids);

        for (const tid of tids) {
            // Skip the user's team
            if (g.userTids.indexOf(tid) >= 0 && g.autoPlaySeasons === 0) {
                continue;
            }

            // Small chance of actually trying to sign someone in free agency, gets greater as time goes on
            if (g.phase === g.PHASE.FREE_AGENCY && Math.random() < 0.99 * g.daysLeft / 30) {
                continue;
            }

            // Skip rebuilding teams sometimes
            if (strategies[tid] === "rebuilding" && Math.random() < 0.7) {
                continue;
            }

/*            // Randomly don't try to sign some players this day
            while (g.phase === g.PHASE.FREE_AGENCY && Math.random() < 0.7) {
                players.shift();
            }*/

            const [numPlayersOnRoster, payroll] = await Promise.all([
                tx2.players.index('tid').count(tid),
                team.getPayroll(tx2, tid).get(0),
            ]);

            if (numPlayersOnRoster < 15) {
                for (let i = 0; i < players.length; i++) {
                    // Don't sign minimum contract players to fill out the roster
                    if (players[i].contract.amount + payroll <= g.salaryCap || (players[i].contract.amount === g.minContract && numPlayersOnRoster < 13)) {
                        let p = players[i];
                        p.tid = tid;
                        if (g.phase <= g.PHASE.PLAYOFFS) { // Otherwise, not needed until next season
                            p = player.addStatsRow(tx2, p, g.phase === g.PHASE.PLAYOFFS);
                        }
                        p = player.setContract(p, p.contract, true);
                        p.gamesUntilTradable = 15;

                        eventLog.add(null, {
                            type: "freeAgent",
                            text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[p.tid], g.season])}">${g.teamNamesCache[p.tid]}</a> signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
                            showNotification: false,
                            pids: [p.pid],
                            tids: [p.tid],
                        });

                        players.splice(i, 1); // Remove from list of free agents

                        await tx2.players.put(p);
                        await team.rosterAutoSort(tx2, tid);

                        // We found one, so stop looking for this team
                        break;
                    }
                }
            }
        }
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
async function decreaseDemands() {
    await g.dbl.tx("players", "readwrite", async tx => {
        await tx.players.index('tid').iterate(g.PLAYER.FREE_AGENT, p => {
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
            for (let i = 0; i < p.freeAgentMood.length; i++) {
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
        });
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
 * @param {boolean} start Is this a new request from the user to simulate days (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed. Default true.
 */
async function play(numDays, start = true) {
    // This is called when there are no more days to play, either due to the user's request (e.g. 1 week) elapsing or at the end of free agency.
    const cbNoDays = async () => {
        await league.setGameAttributesComplete({gamesInProgress: false});
        await ui.updatePlayMenu(null);

        // Check to see if free agency is over
        if (g.daysLeft === 0) {
            await phase.newPhase(g.PHASE.PRESEASON);
            ui.updateStatus("Idle");
        }
    };

    // This simulates a day, including game simulation and any other bookkeeping that needs to be done
    const cbRunDay = async () => {
        // This is called if there are remaining days to simulate
        const cbYetAnother = async () => {
            await decreaseDemands();
            await autoSign();
            await league.setGameAttributesComplete({daysLeft: g.daysLeft - 1, lastDbChange: Date.now()});
            if (g.daysLeft > 0 && numDays > 0) {
                ui.realtimeUpdate(["playerMovement"], undefined, () => {
                    ui.updateStatus(`${g.daysLeft} days left`);
                    play(numDays - 1, false);
                });
            } else if (g.daysLeft === 0) {
                cbNoDays();
            }
        };

        if (numDays > 0) {
            // If we didn't just stop games, let's play
            // Or, if we are starting games (and already passed the lock), continue even if stopGames was just seen
            if (start || !g.stopGames) {
                if (g.stopGames) {
                    await league.setGameAttributesComplete({stopGames: false});
                }
                cbYetAnother();
            }
        } else if (numDays === 0) {
            // If this is the last day, update play menu
            cbNoDays();
        }
    };

    // If this is a request to start a new simulation... are we allowed to do
    // that? If so, set the lock and update the play menu
    if (start) {
        const canStartGames = await lock.canStartGames(null);
        if (canStartGames) {
            await league.setGameAttributesComplete({gamesInProgress: true});
            await ui.updatePlayMenu(null);
            cbRunDay();
        }
    } else {
        cbRunDay();
    }
}

export default {
    autoSign,
    decreaseDemands,
    amountWithMood,
    refuseToNegotiate,
    play,
};
