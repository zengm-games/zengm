const g = require('../globals');
const freeAgents = require('../core/freeAgents');
const player = require('../core/player');
const bbgmViewReact = require('../util/bbgmViewReact');
const WatchList = require('./views/WatchList');

function get(req) {
    return {
        statType: req.params.statType !== undefined ? req.params.statType : "per_game",
        playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season",
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("clearWatchList") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || inputs.statType !== state.statType || inputs.playoffs !== state.playoffs) {
        let players = await g.dbl.players.getAll();
        players = players.filter(p => p.watch && typeof p.watch !== "function"); // In Firefox, objects have a "watch" function
        players = await player.withStats(null, players, {
            statsSeasons: [g.season, g.season - 1], // For oldStats
            statsPlayoffs: inputs.playoffs === "playoffs",
        });
        players = player.filter(players, {
            attrs: ["pid", "name", "age", "injury", "tid", "abbrev", "watch", "contract", "freeAgentMood", "draft"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa"],
            season: g.season,
            totals: inputs.statType === "totals",
            per36: inputs.statType === "per_36",
            playoffs: inputs.playoffs === "playoffs",
            fuzz: true,
            showNoStats: true,
            showRookies: true,
            showRetired: true,
            oldStats: true,
        });

        // Add mood to free agent contracts
        for (let i = 0; i < players.length; i++) {
            if (players[i].tid === g.PLAYER.FREE_AGENT) {
                players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
            }
        }

        return {
            players,
            playoffs: inputs.playoffs,
            statType: inputs.statType,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "watchList",
    get,
    runBefore: [updatePlayers],
    Component: WatchList,
});
