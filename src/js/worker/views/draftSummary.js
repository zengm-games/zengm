// @flow

import {PLAYER} from '../../common';
import {idb} from '../db';
import type {GetOutput} from '../../common/types';

async function updateDraftSummary(
    inputs: GetOutput,
): void | {[key: string]: any} {
    // Update every time because anything could change this (unless all players from class are retired)
    let playersAll = await idb.cache.players.indexGetAll('playersByTid', [0, Infinity]);
    playersAll = playersAll.filter((p) => p.draft.year === inputs.season);
    playersAll = await idb.getCopies.playersPlus(playersAll, {
        attrs: ["tid", "abbrev", "draft", "pid", "name", "age", "hof"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["gp", "min", "pts", "trb", "ast", "per", "ewa"],
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    const players = [];
    for (let i = 0; i < playersAll.length; i++) {
        const pa = playersAll[i];

        if (pa.draft.round === 1 || pa.draft.round === 2) {
            const currentPr = pa.ratings[pa.ratings.length - 1];

            players.push({
                // Attributes
                pid: pa.pid,
                name: pa.name,
                draft: pa.draft,
                currentAge: pa.age,
                currentAbbrev: pa.abbrev,
                hof: pa.hof,

                // Ratings
                currentOvr: pa.tid !== PLAYER.RETIRED ? currentPr.ovr : null,
                currentPot: pa.tid !== PLAYER.RETIRED ? currentPr.pot : null,
                currentSkills: pa.tid !== PLAYER.RETIRED ? currentPr.skills : [],
                pos: currentPr.pos,

                // Stats
                careerStats: pa.careerStats,
            });
        }
    }

    return {
        players,
        season: inputs.season,
    };
}

export default {
    runBefore: [updateDraftSummary],
};
