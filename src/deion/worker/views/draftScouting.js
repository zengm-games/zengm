// @flow

import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function addSeason(season) {
    // In fantasy draft, use temp tid
    const tid =
        g.phase === PHASE.FANTASY_DRAFT
            ? PLAYER.UNDRAFTED_FANTASY_TEMP
            : PLAYER.UNDRAFTED;

    let playersAll = (await idb.cache.players.indexGetAll(
        "playersByDraftYearRetiredYear",
        [[season], [season, Infinity]],
    )).filter(p => p.tid === tid);

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
        const seasonOffset = g.phase >= PHASE.RESIGN_PLAYERS ? 1 : 0;

        const seasons = await Promise.all([
            addSeason(g.season + seasonOffset),
            addSeason(g.season + seasonOffset + 1),
            addSeason(g.season + seasonOffset + 2),
        ]);

        return {
            draftType: g.draftType,
            seasons,
        };
    }
}

export default {
    runBefore: [updateDraftScouting],
};
