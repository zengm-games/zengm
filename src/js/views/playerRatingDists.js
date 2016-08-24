const g = require('../globals');
const player = require('../core/player');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const PlayerRatingDists = require('./views/PlayerRatingDists');

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== state.season) {
        let players = await g.dbl.players.getAll();
        players = await player.withStats(null, players, {statsSeasons: [inputs.season]});

        players = player.filter(players, {
            ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"],
            season: inputs.season,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        const ratingsAll = players.reduce((memo, player) => {
            for (const rating in player.ratings) {
                if (player.ratings.hasOwnProperty(rating)) {
                    if (memo.hasOwnProperty(rating)) {
                        memo[rating].push(player.ratings[rating]);
                    } else {
                        memo[rating] = [player.ratings[rating]];
                    }
                }
            }
            return memo;
        }, {});

        return {
            season: inputs.season,
            ratingsAll,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "playerRatingDists",
    get,
    runBefore: [updatePlayers],
    Component: PlayerRatingDists,
});
