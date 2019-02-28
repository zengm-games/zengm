// @flow

import orderBy from "lodash/orderBy";
import { PHASE } from "../../../common";
import { contractNegotiation, league, player } from "..";
import { idb } from "../../db";
import { g, helpers, local, logEvent, overrides } from "../../util";
import type { Conditions } from "../../../common/types";

const newPhaseResignPlayers = async (conditions: Conditions) => {
    await idb.cache.negotiations.clear();

    const baseMoods = await player.genBaseMoods();

    const teams = await idb.getCopies.teamsPlus({
        attrs: ["strategy"],
        season: g.season,
    });
    const strategies = teams.map(t => t.strategy);

    // Re-sign players on user's team, and some AI players
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        0,
        Infinity,
    ]);

    // Figure out how many players are needed at each position, beyond who is already signed
    const neededPositionsByTid = new Map();
    if (Object.keys(overrides.common.constants.POSITION_COUNTS).length > 0) {
        for (let tid = 0; tid < g.numTeams; tid++) {
            const counts = {
                ...overrides.common.constants.POSITION_COUNTS,
            };
            neededPositionsByTid.set(tid, counts);
        }
        for (const p of players) {
            if (p.contract.exp > g.season) {
                continue;
            }

            const counts = neededPositionsByTid.get(p.tid);
            const pos = p.ratings[p.ratings.length - 1].pos;

            if (counts !== undefined && counts[pos] !== undefined) {
                counts[pos] -= 1;
            }
        }
    }

    const playersSorted = orderBy(players, "value", "desc");
    for (const p of playersSorted) {
        if (p.contract.exp <= g.season) {
            if (g.userTids.includes(p.tid) && local.autoPlaySeasons === 0) {
                const tid = p.tid;

                // Add to free agents first, to generate a contract demand, then open negotiations with player
                player.addToFreeAgents(p, PHASE.RESIGN_PLAYERS, baseMoods);
                await idb.cache.players.put(p);

                const error = await contractNegotiation.create(
                    p.pid,
                    true,
                    tid,
                    p.draft.year === g.season,
                );
                if (error !== undefined && error) {
                    logEvent(
                        {
                            type: "refuseToSign",
                            text: error,
                            pids: [p.pid],
                            tids: [tid],
                        },
                        conditions,
                    );
                }
            } else {
                // Automatically negotiate with teams
                const factor = strategies[p.tid] === "rebuilding" ? 0.4 : 0;

                let skipDueToPos = false;

                const counts = neededPositionsByTid.get(p.tid);
                const pos = p.ratings[p.ratings.length - 1].pos;

                if (
                    counts !== undefined &&
                    counts[pos] !== undefined &&
                    counts[pos] <= 0
                ) {
                    skipDueToPos = true;
                }

                // Should eventually be smarter than a coin flip
                if (!skipDueToPos && Math.random() < p.value / 100 - factor) {
                    const contract = player.genContract(p);
                    contract.exp += 1; // Otherwise contracts could expire this season
                    player.sign(p, p.tid, contract, PHASE.RESIGN_PLAYERS);

                    if (counts !== undefined && counts[pos] !== undefined) {
                        counts[pos] -= 1;
                    }
                } else {
                    player.addToFreeAgents(p, PHASE.RESIGN_PLAYERS, baseMoods);
                }

                await idb.cache.players.put(p);
            }
        }
    }

    // Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
    await league.setGameAttributes({ daysLeft: 30 });

    return [helpers.leagueUrl(["negotiation"]), ["playerMovement"]];
};

export default newPhaseResignPlayers;
