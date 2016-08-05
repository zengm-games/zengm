const g = require('../globals');
const team = require('../core/team');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const TeamStats = require('./views/TeamStats');

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updateTeams(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== state.season) {
        const teams = await team.filter({
            attrs: ["tid", "abbrev"],
            seasonAttrs: ["won", "lost"],
            stats: ["gp", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "oppPts", "diff"],
            season: inputs.season,
        });

        return {
            season: inputs.season,
            teams,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "teamStats",
    get,
    runBefore: [updateTeams],
    Component: TeamStats,
});
