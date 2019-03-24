// @flow

import orderBy from "lodash/orderBy";
import { PHASE, PLAYER } from "../../../common";
import { contractNegotiation, draft, league, player, team } from "..";
import { idb } from "../../db";
import { g, helpers, local, logEvent, overrides } from "../../util";
import type { Conditions } from "../../../common/types";

const newPhaseResignPlayers = async (conditions: Conditions) => {
    await idb.cache.negotiations.clear();

    const baseMoodsReSigning = await player.genBaseMoods(true);
    const baseMoodsFreeAgents = await player.genBaseMoods(false);

    // Reset contract demands of current free agents and undrafted players
    // KeyRange only works because PLAYER.UNDRAFTED is -2 and PLAYER.FREE_AGENT is -1
    const existingFreeAgents = await idb.cache.players.indexGetAll(
        "playersByTid",
        [PLAYER.UNDRAFTED, PLAYER.FREE_AGENT],
    );
    for (const p of existingFreeAgents) {
        player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoodsFreeAgents);
        await idb.cache.players.put(p);
    }

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

    const payrollsByTid = new Map();
    if (g.hardCap) {
        for (let tid = 0; tid < g.numTeams; tid++) {
            const payroll = await team.getPayroll(tid);
            payrollsByTid.set(tid, payroll);
        }
    }

    const playersSorted = orderBy(players, "value", "desc");
    for (const p of playersSorted) {
        if (p.contract.exp <= g.season) {
            if (g.userTids.includes(p.tid) && local.autoPlaySeasons === 0) {
                const tid = p.tid;

                // Add to free agents first, to generate a contract demand, then open negotiations with player
                player.addToFreeAgents(
                    p,
                    PHASE.RESIGN_PLAYERS,
                    baseMoodsReSigning,
                );
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
                // AI teams
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

                const factor = strategies[p.tid] === "rebuilding" ? 0.4 : 0;
                let probReSign = p.value / 100 - factor;

                const payroll = payrollsByTid.get(p.tid);
                const contract = player.genContract(p);

                if (g.hardCap) {
                    if (payroll === undefined) {
                        throw new Error(
                            "Payroll should always be defined if there is a hard cap",
                        );
                    }

                    if (contract.amount + payroll > g.salaryCap) {
                        probReSign = 0;
                    }
                }

                // Should eventually be smarter than a coin flip
                if (!skipDueToPos && Math.random() < probReSign) {
                    contract.exp += 1; // Otherwise contracts could expire this season
                    player.sign(p, p.tid, contract, PHASE.RESIGN_PLAYERS);

                    if (counts !== undefined && counts[pos] !== undefined) {
                        counts[pos] -= 1;
                    }
                    if (payroll !== undefined) {
                        payrollsByTid.set(p.tid, contract.amount + payroll);
                    }
                } else {
                    player.addToFreeAgents(
                        p,
                        PHASE.RESIGN_PLAYERS,
                        baseMoodsFreeAgents,
                    );
                }

                await idb.cache.players.put(p);
            }
        }
    }

    // Bump up future draft classes (not simultaneous so tid updates don't cause race conditions)
    const players3 = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED_2,
    );
    for (const p of players3) {
        p.tid = PLAYER.UNDRAFTED;
        p.ratings[0].fuzz /= Math.sqrt(2);
        player.develop(p, 0); // Update skills/pot based on fuzz
        player.updateValues(p);
        await idb.cache.players.put(p);
    }
    const players4 = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED_3,
    );
    for (const p of players4) {
        p.tid = PLAYER.UNDRAFTED_2;
        p.ratings[0].fuzz /= Math.sqrt(2);
        player.develop(p, 0); // Update skills/pot based on fuzz
        player.updateValues(p);
        await idb.cache.players.put(p);
    }
    await draft.genPlayers(PLAYER.UNDRAFTED_3);

    // Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
    await league.setGameAttributes({ daysLeft: 30 });

    return [helpers.leagueUrl(["negotiation"]), ["playerMovement"]];
};

export default newPhaseResignPlayers;
