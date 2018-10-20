// @flow

import { PHASE, PLAYER } from "../../../common";
import { contractNegotiation, draft, player } from "..";
import { idb } from "../../db";
import { g, helpers, local, logEvent } from "../../util";
import type { Conditions } from "../../../common/types";

const newPhaseFreeAgency = async (conditions: Conditions) => {
    const teams = await idb.getCopies.teamsPlus({
        attrs: ["strategy"],
        season: g.season,
    });
    const strategies = teams.map(t => t.strategy);

    // Delete all current negotiations to resign players
    await contractNegotiation.cancelAll();

    const baseMoods = await player.genBaseMoods();

    // Reset contract demands of current free agents and undrafted players
    // KeyRange only works because PLAYER.UNDRAFTED is -2 and PLAYER.FREE_AGENT is -1
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.UNDRAFTED,
        PLAYER.FREE_AGENT,
    ]);
    for (const p of players) {
        player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoods);
        await idb.cache.players.put(p);
    }

    // AI teams re-sign players or they become free agents
    // Run this after upding contracts for current free agents, or addToFreeAgents will be called twice for these guys
    const players2 = await idb.cache.players.indexGetAll("playersByTid", [
        0,
        Infinity,
    ]);
    for (const p of players2) {
        if (
            p.contract.exp <= g.season &&
            (!g.userTids.includes(p.tid) || local.autoPlaySeasons > 0)
        ) {
            // Automatically negotiate with teams
            const factor = strategies[p.tid] === "rebuilding" ? 0.4 : 0;

            if (Math.random() < p.value / 100 - factor) {
                // Should eventually be smarter than a coin flip
                // See also core.team
                const contract = player.genContract(p);
                contract.exp += 1; // Otherwise contracts could expire this season
                player.sign(p, p.tid, contract, PHASE.FREE_AGENCY);

                logEvent(
                    {
                        type: "reSigned",
                        text: `The <a href="${helpers.leagueUrl([
                            "roster",
                            g.teamAbbrevsCache[p.tid],
                            g.season,
                        ])}">${
                            g.teamNamesCache[p.tid]
                        }</a> re-signed <a href="${helpers.leagueUrl([
                            "player",
                            p.pid,
                        ])}">${p.firstName} ${
                            p.lastName
                        }</a> for ${helpers.formatCurrency(
                            p.contract.amount / 1000,
                            "M",
                        )}/year through ${p.contract.exp}.`,
                        showNotification: false,
                        pids: [p.pid],
                        tids: [p.tid],
                    },
                    conditions,
                );
            } else {
                player.addToFreeAgents(p, PHASE.RESIGN_PLAYERS, baseMoods);
            }

            await idb.cache.players.put(p);
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

    return [helpers.leagueUrl(["free_agents"]), ["playerMovement"]];
};

export default newPhaseFreeAgency;
