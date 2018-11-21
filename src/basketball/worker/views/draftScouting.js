// @flow

import { PHASE, PLAYER } from "../../../deion/common";
import { idb } from "../db";
import { g } from "../../../deion/worker/util";
import type { GetOutput, UpdateEvents } from "../../../deion/common/types";

async function addSeason(season, tid) {
    let playersAll = await idb.cache.players.indexGetAll("playersByTid", tid);

    playersAll = await idb.getCopies.playersPlus(playersAll, {
        attrs: ["pid", "nameAbbrev", "age", "valueFuzz", "watch"],
        ratings: ["ovr", "pot", "skills", "fuzz", "pos"],
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });
    playersAll.sort((a, b) => b.valueFuzz - a.valueFuzz);

    const players = [];
    for (let i = 0; i < playersAll.length; i++) {
        const pa = playersAll[i];

        players.push({
            // Attributes
            pid: pa.pid,
            nameAbbrev: pa.nameAbbrev,
            age: pa.age,
            watch: pa.watch,
            valueFuzz: pa.valueFuzz,

            // Ratings - just take the only entry
            ovr: pa.ratings[0].ovr,
            pot: pa.ratings[0].pot,
            skills: pa.ratings[0].skills,
            pos: pa.ratings[0].pos,

            rank: i + 1,
        });
    }

    return {
        players,
        season,
    };
}

async function updateDraftScouting(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("playerMovement")
    ) {
        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        const seasonOffset = g.phase < PHASE.FREE_AGENCY ? 0 : 1;

        // In fantasy draft, use temp tid
        const firstUndraftedTid =
            g.phase === PHASE.FANTASY_DRAFT
                ? PLAYER.UNDRAFTED_FANTASY_TEMP
                : PLAYER.UNDRAFTED;

        const seasons = await Promise.all([
            addSeason(g.season + seasonOffset, firstUndraftedTid),
            addSeason(g.season + seasonOffset + 1, PLAYER.UNDRAFTED_2),
            addSeason(g.season + seasonOffset + 2, PLAYER.UNDRAFTED_3),
        ]);

        return {
            seasons,
        };
    }
}

export default {
    runBefore: [updateDraftScouting],
};
