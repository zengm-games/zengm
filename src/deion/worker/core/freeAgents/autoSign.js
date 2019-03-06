// @flow

import orderBy from "lodash/orderBy";
import range from "lodash/range";
import { PHASE, PLAYER } from "../../../common";
import { player, team } from "..";
import { idb } from "../../db";
import { g, local, random, overrides } from "../../util";

const getNeededPositions = players => {
    const neededPositions = new Set();

    if (Object.keys(overrides.common.constants.POSITION_COUNTS).length === 0) {
        return neededPositions;
    }

    const counts = {
        ...overrides.common.constants.POSITION_COUNTS,
    };

    for (const p of players) {
        const pos = p.ratings[p.ratings.length - 1].pos;

        if (counts.hasOwnProperty(pos)) {
            counts[pos] -= 1;
        }
    }

    for (const [pos, numNeeded] of Object.entries(counts)) {
        // $FlowFixMe
        if (numNeeded > 0) {
            neededPositions.add(pos);
        }
    }

    return neededPositions;
};

/**
 * AI teams sign free agents.
 *
 * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
const autoSign = async () => {
    const [teams, players] = await Promise.all([
        idb.getCopies.teamsPlus({
            attrs: ["strategy"],
            season: g.season,
        }),
        idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT),
    ]);

    if (players.length === 0) {
        return;
    }

    const strategies = teams.map(t => t.strategy);

    // List of free agents, sorted by value
    const playersSorted = orderBy(players, "value", "desc");

    // Randomly order teams
    const tids = range(g.numTeams);
    random.shuffle(tids);

    for (const tid of tids) {
        // Skip the user's team
        if (g.userTids.includes(tid) && local.autoPlaySeasons === 0) {
            continue;
        }

        // Small chance of actually trying to sign someone in free agency, gets greater as time goes on
        if (
            process.env.SPORT === "basketball" &&
            g.phase === PHASE.FREE_AGENCY &&
            Math.random() < (0.99 * g.daysLeft) / 30
        ) {
            continue;
        }

        // Skip rebuilding teams sometimes
        if (
            process.env.SPORT === "basketball" &&
            strategies[tid] === "rebuilding" &&
            Math.random() < 0.7
        ) {
            continue;
        }

        const playersOnRoster = await idb.cache.players.indexGetAll(
            "playersByTid",
            tid,
        );
        const payroll = await team.getPayroll(tid);
        const numPlayersOnRoster = playersOnRoster.length;

        const neededPositions = getNeededPositions(playersOnRoster);
        const useNeededPositions = Math.random() < 0.9;

        if (numPlayersOnRoster < g.maxRosterSize) {
            for (let i = 0; i < playersSorted.length; i++) {
                const p = playersSorted[i];

                // Skip players if team already has enough at this position
                if (neededPositions.size > 0 && useNeededPositions) {
                    const pos = p.ratings[p.ratings.length - 1].pos;
                    if (!neededPositions.has(pos)) {
                        continue;
                    }
                }

                // Don't sign minimum contract players to fill out the roster
                if (
                    p.contract.amount + payroll <= g.salaryCap ||
                    (p.contract.amount === g.minContract &&
                        numPlayersOnRoster < g.maxRosterSize - 2)
                ) {
                    player.sign(p, tid, p.contract, g.phase);

                    playersSorted.splice(i, 1); // Remove from list of free agents

                    await idb.cache.players.put(p);

                    if (!overrides.core.team.rosterAutoSort) {
                        throw new Error(
                            "Missing overrides.core.team.rosterAutoSort",
                        );
                    }
                    await overrides.core.team.rosterAutoSort(tid);

                    // We found one, so stop looking for this team
                    break;
                }
            }
        }
    }
};

export default autoSign;
