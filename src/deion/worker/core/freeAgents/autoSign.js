// @flow

import orderBy from "lodash/orderBy";
import range from "lodash/range";
import { PHASE, PLAYER } from "../../../common";
import { player, team } from "..";
import getBest from "./getBest";
import { idb } from "../../db";
import { g, local, random, overrides } from "../../util";

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
        if (playersOnRoster.length < g.maxRosterSize) {
            const payroll = await team.getPayroll(tid);
            const p = getBest(playersOnRoster, playersSorted, payroll);

            if (p) {
                player.sign(p, tid, p.contract, g.phase);

                await idb.cache.players.put(p);

                if (!overrides.core.team.rosterAutoSort) {
                    throw new Error(
                        "Missing overrides.core.team.rosterAutoSort",
                    );
                }
                await overrides.core.team.rosterAutoSort(tid);
            }
        }
    }
};

export default autoSign;
