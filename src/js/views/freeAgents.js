const g = require('../globals');
const freeAgents = require('../core/freeAgents');
const player = require('../core/player');
const team = require('../core/team');
const Promise = require('bluebird');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const FreeAgents = require('./views/FreeAgents');

function get() {
    if (g.phase === g.PHASE.RESIGN_PLAYERS) {
        return {
            redirectUrl: helpers.leagueUrl(["negotiation"]),
        };
    }
}

async function updateFreeAgents() {
    let [payroll, userPlayers, players] = await Promise.all([
        team.getPayroll(null, g.userTid).get(0),
        g.dbl.players.index('tid').getAll(g.userTid),
        g.dbl.players.index('tid').getAll(g.PLAYER.FREE_AGENT).then(players => {
            return player.withStats(null, players, {
                statsSeasons: [g.season, g.season - 1],
            });
        }),
    ]);

    let capSpace = (g.salaryCap - payroll) / 1000;
    if (capSpace < 0) {
        capSpace = 0;
    }

    players = player.filter(players, {
        attrs: ["pid", "name", "age", "contract", "freeAgentMood", "injury", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["min", "pts", "trb", "ast", "per"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
        oldStats: true,
    });

    for (let i = 0; i < players.length; i++) {
        players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
        players[i].mood = player.moodColorText(players[i]);
    }

    return {
        capSpace,
        gamesInProgress: g.gamesInProgress,
        minContract: g.minContract,
        numRosterSpots: 15 - userPlayers.length,
        phase: g.phase,
        players,
    };
}

module.exports = bbgmViewReact.init({
    id: "freeAgents",
    get,
    runBefore: [updateFreeAgents],
    Component: FreeAgents,
});
