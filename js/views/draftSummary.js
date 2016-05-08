const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const $ = require('jquery');
const ko = require('knockout');
const components = require('./components');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get(req) {
    let season = helpers.validateSeason(req.params.season);

    // Draft hasn't happened yet this year
    if (g.phase < g.PHASE.DRAFT) {
        if (g.season === g.startingSeason) {
            // No draft history
            return {
                redirectUrl: helpers.leagueUrl(["draft_scouting"])
            };
        }
        if (season === g.season) {
            // View last season by default
            season = g.season - 1;
        }
    }

    return {
        season
    };
}

function InitViewModel() {
    this.season = ko.observable();
}

const mapping = {
    players: {
        create: options => options.data
    }
};

async function updateDraftSummary(inputs) {
    // Update every time because anything could change this (unless all players from class are retired)
    let playersAll = await g.dbl.players.index('draft.year').getAll(inputs.season);
    playersAll = await player.withStats(null, playersAll, {
        statsSeasons: "all"
    });
    playersAll = player.filter(playersAll, {
        attrs: ["tid", "abbrev", "draft", "pid", "name", "age"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["gp", "min", "pts", "trb", "ast", "per", "ewa"],
        showNoStats: true,
        showRookies: true,
        fuzz: true
    });

    const players = [];
    for (let i = 0; i < playersAll.length; i++) {
        const pa = playersAll[i];

        if (pa.draft.round === 1 || pa.draft.round === 2) {
            // Attributes
            const p = {pid: pa.pid, name: pa.name, draft: pa.draft, currentAge: pa.age, currentAbbrev: pa.abbrev};

            // Ratings
            const currentPr = pa.ratings[pa.ratings.length - 1];
            if (pa.tid !== g.PLAYER.RETIRED) {
                p.currentOvr = currentPr.ovr;
                p.currentPot = currentPr.pot;
                p.currentSkills = currentPr.skills;
            } else {
                p.currentOvr = "";
                p.currentPot = "";
                p.currentSkills = "";
            }
            p.pos = currentPr.pos;

            // Stats
            p.careerStats = pa.careerStats;

            players.push(p);
        }
    }

    return {
        players,
        season: inputs.season
    };
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title(vm.season() + " Draft Summary");
    }).extend({throttle: 1});

    ko.computed(() => {
        const season = vm.season();
        ui.datatableSinglePage($("#draft-results"), 0, vm.players().map(p => {
            return [p.draft.round + '-' + p.draft.pick, `<a href="${helpers.leagueUrl(["player", p.pid])}">${p.name}</a>`, p.pos, helpers.draftAbbrev(p.draft.tid, p.draft.originalTid, season), String(p.draft.age), String(p.draft.ovr), String(p.draft.pot), '<span class="skills-alone">' + helpers.skillsBlock(p.draft.skills) + '</span>', '<a href="' + helpers.leagueUrl(["roster", p.currentAbbrev]) + '">' + p.currentAbbrev + '</a>', String(p.currentAge), String(p.currentOvr), String(p.currentPot), '<span class="skills-alone">' + helpers.skillsBlock(p.currentSkills) + '</span>', helpers.round(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1)];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#draft-results"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("draft-summary-dropdown", ["seasons"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "draftSummary",
    get,
    InitViewModel,
    mapping,
    runBefore: [updateDraftSummary],
    uiFirst,
    uiEvery
});
