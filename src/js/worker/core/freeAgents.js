// @flow

import orderBy from 'lodash.orderby';
import _ from 'underscore';
import {PHASE, PLAYER, g, helpers} from '../../common';
import {league, phase, player, team} from '../core';
import {idb} from '../db';
import {lock, logEvent, random, updatePlayMenu, updateStatus, toUI} from '../util';

/**
 * AI teams sign free agents.
 *
 * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
async function autoSign() {
    const [teams, players] = await Promise.all([
        idb.getCopies.teamsPlus({
            attrs: ["strategy"],
            season: g.season,
        }),
        idb.cache.players.indexGetAll('playersByTid', PLAYER.FREE_AGENT),
    ]);

    if (players.length === 0) {
        return;
    }

    const strategies = teams.map(t => t.strategy);

    // List of free agents, sorted by value
    const playersSorted = orderBy(players, 'value', 'desc');

    // Randomly order teams
    const tids = _.range(g.numTeams);
    random.shuffle(tids);

    for (const tid of tids) {
        // Skip the user's team
        if (g.userTids.includes(tid) && g.autoPlaySeasons === 0) {
            continue;
        }

        // Small chance of actually trying to sign someone in free agency, gets greater as time goes on
        if (g.phase === PHASE.FREE_AGENCY && Math.random() < 0.99 * g.daysLeft / 30) {
            continue;
        }

        // Skip rebuilding teams sometimes
        if (strategies[tid] === "rebuilding" && Math.random() < 0.7) {
            continue;
        }

        const playersOnRoster = await idb.cache.players.indexGetAll('playersByTid', tid);
        const payroll = (await team.getPayroll(tid))[0];
        const numPlayersOnRoster = playersOnRoster.length;

        if (numPlayersOnRoster < 15) {
            for (let i = 0; i < playersSorted.length; i++) {
                const p = playersSorted[i];
                // Don't sign minimum contract players to fill out the roster
                if (p.contract.amount + payroll <= g.salaryCap || (p.contract.amount === g.minContract && numPlayersOnRoster < 13)) {
                    p.tid = tid;
                    if (g.phase <= PHASE.PLAYOFFS) { // Otherwise, not needed until next season
                        await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
                    }
                    player.setContract(p, p.contract, true);
                    p.gamesUntilTradable = 15;
                    idb.cache.markDirtyIndexes('players');

                    logEvent({
                        type: "freeAgent",
                        text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[p.tid], g.season])}">${g.teamNamesCache[p.tid]}</a> signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
                        showNotification: false,
                        pids: [p.pid],
                        tids: [p.tid],
                    });

                    playersSorted.splice(i, 1); // Remove from list of free agents

                    await idb.cache.players.put(p);
                    await team.rosterAutoSort(tid);

                    // We found one, so stop looking for this team
                    break;
                }
            }
        }
    }
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
    const players = await idb.cache.players.indexGetAll('playersByTid', PLAYER.FREE_AGENT);
    for (const p of players) {
        // Decrease free agent demands
        p.contract.amount -= 50 * Math.sqrt(g.maxContract / 20000);
        if (p.contract.amount < g.minContract) {
            p.contract.amount = g.minContract;
        }

        if (g.phase !== PHASE.FREE_AGENCY) {
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

        await idb.cache.players.put(p);
    }
}

/**
 * Get contract amount adjusted for mood.
 *
 * @memberOf core.freeAgents
 * @param {number} amount Contract amount, in thousands of dollars or millions of dollars (fun auto-detect!).
 * @param {number} mood Player mood towards a team, from 0 (happy) to 1 (angry).
 * @return {number} Contract amoung adjusted for mood.
 */
function amountWithMood(amount: number, mood: number = 0.5): number {
    amount *= 1 + 0.2 * mood;

    if (amount >= g.minContract) {
        if (amount > g.maxContract) {
            amount = g.maxContract;
        }
        return Math.round(amount / 10) * 10;  // Round to nearest 10k, assuming units are thousands
    }

    if (amount > g.maxContract / 1000) {
        amount = g.maxContract / 1000;
    }
    return Math.round(amount * 100) / 100;  // Round to nearest 10k, assuming units are millions
}

/**
 * Simulates one or more days of free agency.
 *
 * @memberOf core.freeAgents
 * @param {number} numDays An integer representing the number of days to be simulated. If numDays is larger than the number of days remaining, then all of free agency will be simulated up until the preseason starts.
 * @param {boolean} start Is this a new request from the user to simulate days (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed. Default true.
 */
async function play(numDays: number, start?: boolean = true) {
    // This is called when there are no more days to play, either due to the user's request (e.g. 1 week) elapsing or at the end of free agency.
    const cbNoDays = async () => {
        lock.set('gameSim', false);
        await updatePlayMenu();

        // Check to see if free agency is over
        if (g.daysLeft === 0) {
            await updateStatus('Idle');
            await phase.newPhase(PHASE.PRESEASON);
        }
    };

    // This simulates a day, including game simulation and any other bookkeeping that needs to be done
    const cbRunDay = async () => {
        // This is called if there are remaining days to simulate
        const cbYetAnother = async () => {
            await decreaseDemands();
            await autoSign();
            await league.setGameAttributes({daysLeft: g.daysLeft - 1});
            if (g.daysLeft > 0 && numDays > 0) {
                await toUI('realtimeUpdate', ["playerMovement"]);
                await updateStatus(`${g.daysLeft} days left`);
                play(numDays - 1, false);
            } else {
                await cbNoDays();
            }
        };

        // If we didn't just stop games, let's play
        // Or, if we are starting games (and already passed the lock), continue even if stopGames was just seen
        if (numDays > 0 && (start || !g.stopGames)) {
            if (g.stopGames) {
                await league.setGameAttributes({stopGames: false});
            }
            await cbYetAnother();
        } else {
            // If this is the last day, update play menu
            await cbNoDays();
        }
    };

    // If this is a request to start a new simulation... are we allowed to do
    // that? If so, set the lock and update the play menu
    if (start) {
        const canStartGames = await lock.canStartGames();
        if (canStartGames) {
            lock.set('gameSim', true);
            await updatePlayMenu();
            await cbRunDay();
        }
    } else {
        await cbRunDay();
    }
}

export default {
    autoSign,
    decreaseDemands,
    amountWithMood,
    play,
};
