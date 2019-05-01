// @flow

import { PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";

async function updateDraftTeamHistory(inputs: {
    abbrev: string,
    tid: number,
}): void | { [key: string]: any } {
    const stats =
        process.env.SPORT === "basketball"
            ? ["gp", "min", "pts", "trb", "ast", "per", "ewa"]
            : ["gp", "keyStats", "av"];

    let playersAll = await idb.getCopies.players({
        filter: p => p.draft.tid === inputs.tid,
    });
    playersAll = await idb.getCopies.playersPlus(playersAll, {
        attrs: ["tid", "abbrev", "draft", "pid", "name", "age", "hof"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    const players = playersAll.map(p => {
        const currentPr = p.ratings[p.ratings.length - 1];

        return {
            // Attributes
            pid: p.pid,
            name: p.name,
            draft: p.draft,
            currentAge: p.age,
            currentAbbrev: p.abbrev,
            hof: p.hof,

            // Ratings
            currentOvr: p.tid !== PLAYER.RETIRED ? currentPr.ovr : null,
            currentPot: p.tid !== PLAYER.RETIRED ? currentPr.pot : null,
            currentSkills: p.tid !== PLAYER.RETIRED ? currentPr.skills : [],
            pos: currentPr.pos,

            // Stats
            careerStats: p.careerStats,
        };
    });

    const abbrev = inputs.abbrev;
    const tid = g.teamAbbrevsCache.indexOf(abbrev);
    const region = g.teamRegionsCache[tid];
    const name = g.teamNamesCache[tid];
    const userAbbrev = g.teamAbbrevsCache[g.userTid];

    return {
        abbrev,
        draftType: g.draftType,
        name,
        players,
        region,
        stats,
        userAbbrev,
    };
}

export default {
    runBefore: [updateDraftTeamHistory],
};
