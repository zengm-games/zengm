// @flow

import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import DraftSummary from './views/DraftSummary';

function get(ctx) {
    let season = helpers.validateSeason(ctx.params.season);

    // Draft hasn't happened yet this year
    if (g.phase < g.PHASE.DRAFT) {
        if (g.season === g.startingSeason) {
            // No draft history
            return {
                redirectUrl: helpers.leagueUrl(["draft_scouting"]),
            };
        }
        if (season === g.season) {
            // View last season by default
            season = g.season - 1;
        }
    }

    return {
        season,
    };
}

async function updateDraftSummary(inputs) {
    // Update every time because anything could change this (unless all players from class are retired)
    let playersAll = await g.dbl.players.index('draft.year').getAll(inputs.season);
    playersAll = await player.withStats(null, playersAll, {
        statsSeasons: "all",
    });
    playersAll = player.filter(playersAll, {
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
                currentOvr: pa.tid !== g.PLAYER.RETIRED ? currentPr.ovr : null,
                currentPot: pa.tid !== g.PLAYER.RETIRED ? currentPr.pot : null,
                currentSkills: pa.tid !== g.PLAYER.RETIRED ? currentPr.skills : [],
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

export default bbgmViewReact.init({
    id: "draftSummary",
    get,
    runBefore: [updateDraftSummary],
    Component: DraftSummary,
});
