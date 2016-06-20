const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const backboard = require('backboard');
const $ = require('jquery');
const ko = require('knockout');
const components = require('./components');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

function InitViewModel() {
    this.season = ko.observable();
}

const mapping = {
    players: {
        create: options => options.data,
    },
};

async function updatePlayers(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
        let players = await g.dbl.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.RETIRED));
        players = await player.withStats(null, players, {statsSeasons: [inputs.season]});
        players = player.filter(players, {
            attrs: ["pid", "name", "age", "injury", "watch"],
            ratings: ["skills", "pos"],
            stats: ["abbrev", "gp", "gs", "min", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp"],
            season: inputs.season,
        });

        return {
            season: inputs.season,
            players,
        };
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title(`Player Shot Locations - ${vm.season()}`);
    }).extend({throttle: 1});

    ko.computed(() => {
        const season = vm.season();
        ui.datatable($("#player-shot-locations"), 0, vm.players().map(p => {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, `<a href="${helpers.leagueUrl(["roster", p.stats.abbrev, season])}">${p.stats.abbrev}</a>`, String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.min, 1), helpers.round(p.stats.fgAtRim, 1), helpers.round(p.stats.fgaAtRim, 1), helpers.round(p.stats.fgpAtRim, 1), helpers.round(p.stats.fgLowPost, 1), helpers.round(p.stats.fgaLowPost, 1), helpers.round(p.stats.fgpLowPost, 1), helpers.round(p.stats.fgMidRange, 1), helpers.round(p.stats.fgaMidRange, 1), helpers.round(p.stats.fgpMidRange, 1), helpers.round(p.stats.tp, 1), helpers.round(p.stats.tpa, 1), helpers.round(p.stats.tpp, 1)];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#player-shot-locations"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("player-shot-locations-dropdown", ["seasons"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "playerShotLocations",
    get,
    InitViewModel,
    mapping,
    runBefore: [updatePlayers],
    uiFirst,
    uiEvery,
});
