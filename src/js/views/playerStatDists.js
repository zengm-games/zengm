import g from '../globals';
import player from '../core/player';
import backboard from 'backboard';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import PlayerStatDists from './views/PlayerStatDists';

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

        const statsAll = players.reduce((memo, p) => {
            for (const stat of Object.keys(p.stats)) {
                if (memo.hasOwnProperty(stat)) {
                    memo[stat].push(p.stats[stat]);
                } else {
                    memo[stat] = [p.stats[stat]];
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

export default bbgmViewReact.init({
    id: "playerStatDists",
    get,
    runBefore: [updatePlayers],
    Component: PlayerStatDists,
});
