const g = require('../globals');
const player = require('../core/player');
const backboard = require('backboard');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const UpcomingFreeAgents = require('./views/UpcomingFreeAgents');

function get(req) {
    let season = helpers.validateSeason(req.params.season);

    if (g.phase <= g.PHASE.RESIGN_PLAYERS) {
        if (season < g.season) {
            season = g.season;
        }
    } else if (season < g.season + 1) {
        season = g.season + 1;
    }

    return {
        season,
    };
}

async function updateUpcomingFreeAgents(inputs) {
    let players = await g.dbl.players.index('tid').getAll(backboard.lowerBound(0));
    players = players.filter(p => p.contract.exp === inputs.season);
    players = await player.withStats(null, players, {statsSeasons: [g.season]});

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
        fuzz: true,
    });

    return {
        players,
        season: inputs.season,
    };
}

module.exports = bbgmViewReact.init({
    id: "upcomingFreeAgents",
    get,
    runBefore: [updateUpcomingFreeAgents],
    Component: UpcomingFreeAgents,
});
