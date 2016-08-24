const g = require('../globals');
const player = require('../core/player');
const backboard = require('backboard');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const PlayerStatDists = require('./views/PlayerStatDists');

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== state.season) {
        let players = await g.dbl.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.RETIRED));
        players = await player.withStats(null, players, {statsSeasons: [inputs.season]});
        players = player.filter(players, {
            ratings: ["skills"],
            stats: ["gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"],
            season: inputs.season,
        });

        const statsAll = players.reduce((memo, player) => {
            for (const stat in player.stats) {
                if (player.stats.hasOwnProperty(stat)) {
                    if (memo.hasOwnProperty(stat)) {
                        memo[stat].push(player.stats[stat]);
                    } else {
                        memo[stat] = [player.stats[stat]];
                    }
                }
            }
            return memo;
        }, {});

        return {
            season: inputs.season,
            statsAll,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "playerStatDists",
    get,
    runBefore: [updatePlayers],
    Component: PlayerStatDists,
});
