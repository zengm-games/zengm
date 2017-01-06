import g from '../globals';
import * as team from '../core/team';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import TeamStats from './views/TeamStats';

function get(ctx) {
    return {
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updateTeams(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
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
        for (const t of teams) {
            for (const statType of statTypes) {
                if (!stats[statType]) {
                    stats[statType] = [];
                }

                stats[statType].push(t[statType]);
            }
        }

        // Sort stat types. "Better" values are at the start of the arrays.
        for (const statType of Object.keys(stats)) {
            stats[statType].sort((a, b) => {
                // Sort lowest first.
                if (lowerIsBetter.includes(statType)) {
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    }

                    return 0;
                }

                // Sort highest first.
                if (a < b) {
                    return 1;
                } else if (a > b) {
                    return -1;
                }

                return 0;
            });
        }

        return {
            season: inputs.season,
            stats,
            teams,
        };
    }
}

export default bbgmViewReact.init({
    id: "teamStats",
    get,
    runBefore: [updateTeams],
    Component: TeamStats,
});
