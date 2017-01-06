import g from '../globals';
import * as team from '../core/team';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import TeamStatDists from './views/TeamStatDists';

function get(ctx) {
    return {
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updateTeams(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        const teams = await team.filter({
            seasonAttrs: ["won", "lost"],
            stats: ["fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts"],
            season: inputs.season,
        });

        const statsAll = teams.reduce((memo, t) => {
            for (const stat of Object.keys(t)) {
                if (memo.hasOwnProperty(stat)) {
                    memo[stat].push(t[stat]);
                } else {
                    memo[stat] = [t[stat]];
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
    id: "teamStatDists",
    get,
    runBefore: [updateTeams],
    Component: TeamStatDists,
});
