// @flow

import { PLAYER } from "../../../deion/common";
import { freeAgents, player, team } from "../core";
import { idb } from "../db";
import { g } from "../util";

async function updateNegotiationList(): void | { [key: string]: any } {
    const stats = ["min", "pts", "trb", "ast", "per"];

    let negotiations = await idb.cache.negotiations.getAll();

    // For Multi Team Mode, might have other team's negotiations going on
    negotiations = negotiations.filter(
        negotiation => negotiation.tid === g.userTid,
    );
    const negotiationPids = negotiations.map(negotiation => negotiation.pid);

    let [userPlayers, players] = await Promise.all([
        idb.cache.players.indexGetAll("playersByTid", g.userTid),
        idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT),
    ]);
    players = players.filter(p => negotiationPids.includes(p.pid));
    players = await idb.getCopies.playersPlus(players, {
        attrs: [
            "pid",
            "name",
            "age",
            "freeAgentMood",
            "injury",
            "watch",
            "contract",
        ],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats,
        season: g.season,
        tid: g.userTid,
        showNoStats: true,
        fuzz: true,
    });

    for (const p of players) {
        // Can use g.userTid instead of neogtiation.tid because only user can view this page
        p.contract.amount = freeAgents.amountWithMood(
            p.contract.amount,
            p.freeAgentMood[g.userTid],
        );
        p.mood = player.moodColorText(p);
    }

    const payroll = await team.getPayroll(g.userTid);
    const capSpace = g.salaryCap > payroll ? (g.salaryCap - payroll) / 1000 : 0;

    return {
        capSpace,
        hardCap: g.hardCap,
        minContract: g.minContract,
        numRosterSpots: g.maxRosterSize - userPlayers.length,
        players,
        stats,
        userTid: g.userTid,
    };
}

export default {
    runBefore: [updateNegotiationList],
};
