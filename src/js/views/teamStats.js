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

        /*
         * Sort stats so we can determine what percentile our team is in.
         */
        const stats = {};
        const statTypes = ['won', 'lost', 'fg', 'fga', 'fgp', 'tp', 'tpa', 'tpp', 'ft', 'fta', 'ftp', 'orb', 'drb', 'trb', 'ast', 'tov', 'stl', 'blk', 'ba', 'pf', 'pts', 'oppPts', 'diff'];
        const lowerIsBetter = ['lost', 'tov', 'ba', 'pf', 'oppPts'];

        // Loop teams and stat types.
        for (const team of teams) {
            for (const statType of statTypes) {
                if (!stats[statType]) {
                    stats[statType] = [];
                }

                stats[statType].push(team[statType]);
            }
        }

        // Sort stat types. "Better" values are at the start of the arrays.
        for (const [statType, statValues] of Object.entries(stats)) {
            stats[statType].sort((a, b) => {
                // Sort lowest first.
                if (lowerIsBetter.indexOf(statType) > -1) {
                    if (a < b) return -1;
                    else if (a > b) return 1;
                    else return 0;
                // Sort highest first.
                } else {
                    if (a < b) return 1;
                    else if (a > b) return -1;
                    else return 0;
                }
            });
        }

        return {
            season: inputs.season,
            stats,
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
