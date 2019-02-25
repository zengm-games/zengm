// @flow

import { PHASE, PLAYER } from "../../../common";
import { contractNegotiation, draft, league, player } from "..";
import { idb } from "../../db";
import { g, helpers, local, logEvent } from "../../util";
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
    for (const p of players) {
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

                // Should eventually be smarter than a coin flip
                if (Math.random() < p.value / 100 - factor) {
                    const contract = player.genContract(p);
                    contract.exp += 1; // Otherwise contracts could expire this season
                    player.sign(p, p.tid, contract, PHASE.RESIGN_PLAYERS);
                } else {
                    player.addToFreeAgents(p, PHASE.RESIGN_PLAYERS, baseMoods);
                }

                await idb.cache.players.put(p);
            }
        }
    }

    // Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
    await league.setGameAttributes({ daysLeft: 30 });

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

    return [helpers.leagueUrl(["negotiation"]), ["playerMovement"]];
};

export default newPhaseResignPlayers;
