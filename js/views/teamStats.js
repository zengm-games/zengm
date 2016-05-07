const g = require('../globals');
const ui = require('../ui');
const team = require('../core/team');
const $ = require('jquery');
const ko = require('knockout');
const components = require('./components');
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
    teams: {
        create: options => options.data
    }
};

async function updateTeams(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
        const teams = await team.filter({
            attrs: ["abbrev"],
            seasonAttrs: ["won", "lost"],
            stats: ["gp", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "oppPts", "diff"],
            season: inputs.season
        });

        return {
            season: inputs.season,
            teams
        };
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title("Team Stats - " + vm.season());
    }).extend({throttle: 1});

    ko.computed(() => {
        var season;
        season = vm.season();
        ui.datatableSinglePage($("#team-stats"), 2, vm.teams().map(t => {
            return [`<a href="${helpers.leagueUrl(["roster", t.abbrev, season])}">${t.abbrev}</a>`, String(t.gp), String(t.won), String(t.lost), helpers.round(t.fg, 1), helpers.round(t.fga, 1), helpers.round(t.fgp, 1), helpers.round(t.tp, 1), helpers.round(t.tpa, 1), helpers.round(t.tpp, 1), helpers.round(t.ft, 1), helpers.round(t.fta, 1), helpers.round(t.ftp, 1), helpers.round(t.orb, 1), helpers.round(t.drb, 1), helpers.round(t.trb, 1), helpers.round(t.ast, 1), helpers.round(t.tov, 1), helpers.round(t.stl, 1), helpers.round(t.blk, 1), helpers.round(t.ba, 1), helpers.round(t.pf, 1), helpers.round(t.pts, 1), helpers.round(t.oppPts, 1), helpers.round(t.diff, 1)];
        }), {
            rowCallback: (row, data) => {
                // Show point differential in green or red for positive or negative
                if (data[data.length - 1] > 0) {
                    row.childNodes[row.childNodes.length - 1].classList.add("text-success");
                } else if (data[data.length - 1] < 0) {
                    row.childNodes[row.childNodes.length - 1].classList.add("text-danger");
                }
            }
        });
    }).extend({throttle: 1});

    ui.tableClickableRows($("#team-stats"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("team-stats-dropdown", ["seasons"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "teamStats",
    get,
    InitViewModel,
    mapping,
    runBefore: [updateTeams],
    uiFirst,
    uiEvery
});
