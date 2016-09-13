import g from '../globals';
import team from '../core/team';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import TeamStatDists from './views/TeamStatDists';

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updateTeams(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== state.season) {
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
