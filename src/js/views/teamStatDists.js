const g = require('../globals');
const team = require('../core/team');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const TeamStatDists = require('./views/TeamStatDists');

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

        const statsAll = teams.reduce((memo, team) => {
            for (const stat in team) {
                if (team.hasOwnProperty(stat)) {
                    if (memo.hasOwnProperty(stat)) {
                        memo[stat].push(team[stat]);
                    } else {
                        memo[stat] = [team[stat]];
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
    id: "teamStatDists",
    get,
    runBefore: [updateTeams],
    Component: TeamStatDists,
});
