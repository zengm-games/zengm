import g from '../globals';
import player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import DraftSummary from './views/DraftSummary';

function get(req) {
    let season = helpers.validateSeason(req.params.season);

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
            // Attributes
            const p = {pid: pa.pid, name: pa.name, draft: pa.draft, currentAge: pa.age, currentAbbrev: pa.abbrev, hof: pa.hof};

            // Ratings
            const currentPr = pa.ratings[pa.ratings.length - 1];
            if (pa.tid !== g.PLAYER.RETIRED) {
                p.currentOvr = currentPr.ovr;
                p.currentPot = currentPr.pot;
                p.currentSkills = currentPr.skills;
            } else {
                p.currentOvr = null;
                p.currentPot = null;
                p.currentSkills = [];
            }
            p.pos = currentPr.pos;

            // Stats
            p.careerStats = pa.careerStats;

            players.push(p);
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
