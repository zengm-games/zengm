// @flow

import { PLAYER } from "../../common";
import { freeAgents, player, team } from "../core";
import { idb } from "../db";
import { g, lock } from "../util";

async function updateFreeAgents(): void | { [key: string]: any } {
    const payroll = await team.getPayroll(g.userTid);
    let [userPlayers, players] = await Promise.all([
        idb.cache.players.indexGetAll("playersByTid", g.userTid),
        idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT),
    ]);

    const capSpace = g.salaryCap > payroll ? (g.salaryCap - payroll) / 1000 : 0;

    const stats =
        process.env.SPORT === "basketball"
            ? ["min", "pts", "trb", "ast", "per"]
            : ["gp", "keyStats", "av"];

    players = await idb.getCopies.playersPlus(players, {
        attrs: [
            "pid",
            "name",
            "age",
            "contract",
            "freeAgentMood",
            "injury",
            "watch",
        ],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats,
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
        oldStats: true,
    });

    userPlayers = await idb.getCopies.playersPlus(userPlayers, {
        attrs: [],
        ratings: ["pos"],
        stats: [],
        season: g.season,
        showNoStats: true,
        showRookies: true,
    });

    for (const p of players) {
        p.contract.amount = freeAgents.amountWithMood(
            p.contract.amount,
            p.freeAgentMood[g.userTid],
        );
        p.mood = player.moodColorText(p);
    }

    return {
        capSpace,
        gamesInProgress: lock.get("gameSim"),
        hardCap: g.hardCap,
        minContract: g.minContract,
        numRosterSpots: g.maxRosterSize - userPlayers.length,
        phase: g.phase,
        players,
        playersRefuseToNegotiate: g.playersRefuseToNegotiate,
        stats,
        userPlayers,
        userTid: g.userTid,
    };
}

export default {
    runBefore: [updateFreeAgents],
};
