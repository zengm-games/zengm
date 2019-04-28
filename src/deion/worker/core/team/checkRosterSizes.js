// @flow

import { PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import { g, helpers, local, overrides } from "../../util";

/**
 * Check roster size limits
 *
 * If any AI team is over the maximum roster size, cut their worst players.
 * If any AI team is under the minimum roster size, sign minimum contract
 * players until the limit is reached. If the user's team is breaking one of
 * these roster size limits, display a warning.
 *
 * @memberOf core.team
 * @return {Promise.?string} Resolves to null if there is no error, or a string with the error message otherwise.
 */
const checkRosterSizes = async (): Promise<string | void> => {
    const minFreeAgents = [];
    let userTeamSizeError;

    const checkRosterSize = async tid => {
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            tid,
        );
        let numPlayersOnRoster = players.length;
        if (numPlayersOnRoster > g.maxRosterSize) {
            if (g.userTids.includes(tid) && local.autoPlaySeasons === 0) {
                if (g.userTids.length <= 1) {
                    userTeamSizeError = "Your team has ";
                } else {
                    userTeamSizeError = `The ${g.teamRegionsCache[tid]} ${
                        g.teamNamesCache[tid]
                    } have `;
                }
                userTeamSizeError += `more than the maximum number of players (${
                    g.maxRosterSize
                }). You must remove players (by <a href="${helpers.leagueUrl([
                    "roster",
                ])}">releasing them from your roster</a> or through <a href="${helpers.leagueUrl(
                    ["trade"],
                )}">trades</a>) before continuing.`;
            } else {
                // Automatically drop lowest value players until we reach g.maxRosterSize
                players.sort((a, b) => a.value - b.value); // Lowest first
                const promises = [];
                for (let i = 0; i < numPlayersOnRoster - g.maxRosterSize; i++) {
                    promises.push(player.release(players[i], false));
                }
                await Promise.all(promises);
            }
        } else if (numPlayersOnRoster < g.minRosterSize) {
            if (g.userTids.includes(tid) && local.autoPlaySeasons === 0) {
                if (g.userTids.length <= 1) {
                    userTeamSizeError = "Your team has ";
                } else {
                    userTeamSizeError = `The ${g.teamRegionsCache[tid]} ${
                        g.teamNamesCache[tid]
                    } have `;
                }
                userTeamSizeError += `less than the minimum number of players (${
                    g.minRosterSize
                }). You must add players (through <a href="${helpers.leagueUrl([
                    "free_agents",
                ])}">free agency</a> or <a href="${helpers.leagueUrl([
                    "trade",
                ])}">trades</a>) before continuing.<br><br>Reminder: you can always sign free agents to ${helpers.formatCurrency(
                    g.minContract / 1000,
                    "M",
                    2,
                )}/yr contracts, even if you're over the cap!`;
            } else {
                // Auto-add players
                while (numPlayersOnRoster < g.minRosterSize) {
                    // See also core.phase
                    const p = minFreeAgents.shift();
                    if (!p) {
                        userTeamSizeError = `AI team ${
                            g.teamAbbrevsCache[tid]
                        } needs to add a player to meet the minimum roster requirements, but there are not enough free agents asking for a minimum salary. Easiest way to fix this is God Mode, give them extra players.`;
                        break;
                    }

                    player.sign(p, tid, p.contract, g.phase);
                    await idb.cache.players.put(p);

                    numPlayersOnRoster += 1;
                }
            }
        }

        // Auto sort rosters (except player's team)
        // This will sort all AI rosters before every game. Excessive? It could change some times, but usually it won't
        if (!g.userTids.includes(tid) || local.autoPlaySeasons > 0) {
            if (!overrides.core.team.rosterAutoSort) {
                throw new Error("Missing overrides.core.team.rosterAutoSort");
            }
            return overrides.core.team.rosterAutoSort(tid);
        }
    };

    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.FREE_AGENT,
    );

    // List of free agents looking for minimum contracts, sorted by value. This is used to bump teams up to the minimum roster size.
    for (let i = 0; i < players.length; i++) {
        if (players[i].contract.amount === g.minContract) {
            minFreeAgents.push(players[i]);
        }
    }
    minFreeAgents.sort((a, b) => b.value - a.value);

    // Make sure teams are all within the roster limits
    for (let i = 0; i < g.numTeams; i++) {
        await checkRosterSize(i);
        if (userTeamSizeError) {
            break;
        }
    }

    return userTeamSizeError;
};

export default checkRosterSizes;
