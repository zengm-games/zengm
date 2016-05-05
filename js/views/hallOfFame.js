const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const $ = require('jquery');
const ko = require('knockout');
const _ = require('underscore');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');


function get(req) {
    return {
        season: helpers.validateSeason(req.params.season)
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

function updatePlayers(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.BEFORE_DRAFT)) {
        return g.dbl.players.index('tid').getAll(g.PLAYER.RETIRED).then(function (players) {
            players = players.filter(function (p) {
                return p.hof;
            });
            return player.withStats(null, players, {statsSeasons: "all"});
        }).then(function (players) {
            var i, j;

            players = player.filter(players, {
                attrs: ["pid", "name", "draft", "retiredYear", "statsTids"],
                ratings: ["ovr", "pos"],
                stats: ["season", "abbrev", "gp", "min", "trb", "ast", "pts", "per", "ewa"]
            });

            // This stuff isn't in player.filter because it's only used here.
            for (i = 0; i < players.length; i++) {
                players[i].peakOvr = 0;
                for (j = 0; j < players[i].ratings.length; j++) {
                    if (players[i].ratings[j].ovr > players[i].peakOvr) {
                        players[i].peakOvr = players[i].ratings[j].ovr;
                    }
                }

                players[i].bestStats = {
                    gp: 0,
                    min: 0,
                    per: 0
                };
                for (j = 0; j < players[i].stats.length; j++) {
                    if (players[i].stats[j].gp * players[i].stats[j].min * players[i].stats[j].per > players[i].bestStats.gp * players[i].bestStats.min * players[i].bestStats.per) {
                        players[i].bestStats = players[i].stats[j];
                    }
                }
            }

            return {
                players: players
            };
        });
    }
}

function uiFirst(vm) {
    ui.title("Hall of Fame");

    ko.computed(function () {
        ui.datatable($("#hall-of-fame"), 2, _.map(vm.players(), function (p) {
            var pick;
            if (p.draft.round > 0) {
                pick = p.draft.round + '-' + p.draft.pick;
            } else {
                pick = '';
            }
            return ['<a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a>', p.ratings[p.ratings.length - 1].pos, String(p.draft.year), String(p.retiredYear), pick, String(p.peakOvr), String(p.bestStats.season), '<a href="' + helpers.leagueUrl(["roster", p.bestStats.abbrev, p.bestStats.season]) + '">' + p.bestStats.abbrev + '</a>', String(p.bestStats.gp), helpers.round(p.bestStats.min, 1), helpers.round(p.bestStats.pts, 1), helpers.round(p.bestStats.trb, 1), helpers.round(p.bestStats.ast, 1), helpers.round(p.bestStats.per, 1), String(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1), p.statsTids.indexOf(g.userTid) >= 0];
        }), {
            rowCallback: function (row, data) {
                // Highlight players from the user's team
                if (data[data.length - 1]) {
                    row.classList.add("info");
                }
            }
        });
    }).extend({throttle: 1});

    ui.tableClickableRows($("#hall-of-fame"));
}

module.exports = bbgmView.init({
    id: "hallOfFame",
    get,
    InitViewModel,
    mapping,
    runBefore: [updatePlayers],
    uiFirst
});
