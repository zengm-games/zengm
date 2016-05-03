var g = require('../globals');
var ui = require('../ui');
var player = require('../core/player');
var $ = require('jquery');
var ko = require('knockout');
var _ = require('underscore');
var components = require('./components');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

var mapping;

function get(req) {
    var season;

    season = helpers.validateSeason(req.params.season);

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
        season: season
    };
}

function InitViewModel() {
    this.season = ko.observable();
}

mapping = {
    players: {
        create: function (options) {
            return options.data;
        }
    }
};

function updateDraftSummary(inputs) {
    // Update every time because anything could change this (unless all players from class are retired)
    return g.dbl.players.index('draft.year').getAll(inputs.season).then(function (players) {
        return player.withStats(null, players, {
            statsSeasons: "all"
        });
    }).then(function (playersAll) {
        var currentPr, i, p, pa, players;

        playersAll = player.filter(playersAll, {
            attrs: ["tid", "abbrev", "draft", "pid", "name", "age"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["gp", "min", "pts", "trb", "ast", "per", "ewa"],
            showNoStats: true,
            showRookies: true,
            fuzz: true
        });

        players = [];
        for (i = 0; i < playersAll.length; i++) {
            pa = playersAll[i];

            if (pa.draft.round === 1 || pa.draft.round === 2) {
                // Attributes
                p = {pid: pa.pid, name: pa.name, draft: pa.draft, currentAge: pa.age, currentAbbrev: pa.abbrev};

                // Ratings
                currentPr = pa.ratings[pa.ratings.length - 1];
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
            season: inputs.season,
            players: players
        };
    });
}

function uiFirst(vm) {
    ko.computed(function () {
        ui.title(vm.season() + " Draft Summary");
    }).extend({throttle: 1});

    ko.computed(function () {
        var season;
        season = vm.season();
        ui.datatableSinglePage($("#draft-results"), 0, _.map(vm.players(), function (p) {
            return [p.draft.round + '-' + p.draft.pick, '<a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a>', p.pos, helpers.draftAbbrev(p.draft.tid, p.draft.originalTid, season), String(p.draft.age), String(p.draft.ovr), String(p.draft.pot), '<span class="skills-alone">' + helpers.skillsBlock(p.draft.skills) + '</span>', '<a href="' + helpers.leagueUrl(["roster", p.currentAbbrev]) + '">' + p.currentAbbrev + '</a>', String(p.currentAge), String(p.currentOvr), String(p.currentPot), '<span class="skills-alone">' + helpers.skillsBlock(p.currentSkills) + '</span>', helpers.round(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1)];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#draft-results"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("draft-summary-dropdown", ["seasons"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "draftSummary",
    get: get,
    InitViewModel: InitViewModel,
    mapping: mapping,
    runBefore: [updateDraftSummary],
    uiFirst: uiFirst,
    uiEvery: uiEvery
});
