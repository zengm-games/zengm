// @flow

import { PLAYER } from "../../../deion/common";
import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";

async function updateDraftSummary(inputs: {
    season: number,
}): void | { [key: string]: any } {
    const stats = ["gp", "min", "pts", "trb", "ast", "per", "ewa"];

    // Update every time because anything could change this (unless all players from class are retired)
    let playersAll;
    if (g.season === inputs.season) {
        // This is guaranteed to work (ignoring God Mode) because no player this season has had a chance to die or retire
        playersAll = await idb.cache.players.indexGetAll("playersByTid", [
            0,
            Infinity,
        ]);
    } else {
        playersAll = await idb.getCopies.players({ draftYear: inputs.season });
    }
    playersAll = playersAll.filter(p => {
        return (
            p.draft.year === inputs.season &&
            (p.draft.round === 1 || p.draft.round === 2)
        );
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

    return {
        players,
        season: inputs.season,
        stats,
        userTid: g.userTid,
    };
}

export default {
    runBefore: [updateDraftSummary],
};
