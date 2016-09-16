import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import PlayerRatingDists from './views/PlayerRatingDists';

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

        const ratingsAll = players.reduce((memo, p) => {
            for (const rating of Object.keys(p.ratings)) {
                if (memo.hasOwnProperty(rating)) {
                    memo[rating].push(p.ratings[rating]);
                } else {
                    memo[rating] = [p.ratings[rating]];
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

export default bbgmViewReact.init({
    id: "playerRatingDists",
    get,
    runBefore: [updatePlayers],
    Component: PlayerRatingDists,
});
