const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const backboard = require('backboard');
const $ = require('jquery');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');

function get(req) {
    let season = helpers.validateSeason(req.params.season);

    if (g.phase <= g.PHASE.RESIGN_PLAYERS) {
        if (season < g.season) {
            season = g.season;
        }
    } else {
        if (season < g.season + 1) {
            season = g.season + 1;
        }
    }

    return {
        season
    };
}

const mapping = {
    players: {
        create: options => options.data
    }
};

async function updateUpcomingFreeAgents(inputs) {
    let players = await g.dbl.players.index('tid').getAll(backboard.lowerBound(0));
    players = players.filter(p => p.contract.exp === inputs.season);
    players = await player.withStats(null, players, {statsSeasons: [g.season]});
    var i;

    // Done before filter so full player object can be passed to player.genContract.
    for (let i = 0; i < players.length; i++) {
        players[i].contractDesired = player.genContract(players[i], false, false); // No randomization
        players[i].contractDesired.amount /= 1000;
        players[i].contractDesired.exp += inputs.season - g.season;
    }

    players = player.filter(players, {
        attrs: ["pid", "name", "age", "contract", "freeAgentMood", "injury", "watch", "contractDesired"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["min", "pts", "trb", "ast", "per"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true
    });

    return {
        players,
        season: inputs.season
    };
}

function uiFirst(vm) {
    ui.title("Upcoming Free Agents");

    ko.computed(() => {
        ui.datatable($("#upcoming-free-agents"), 4, vm.players().map(p => {
            // The display: none for mood allows sorting, somehow
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.formatCurrency(p.contractDesired.amount, "M") + ' thru ' + p.contractDesired.exp];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#upcoming-free-agents"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("upcoming-free-agents-dropdown", ["seasonsUpcoming"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "upcomingFreeAgents",
    get,
    mapping,
    runBefore: [updateUpcomingFreeAgents],
    uiFirst,
    uiEvery
});
