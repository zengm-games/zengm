// @flow

import g from '../../globals';
import {getCopy} from '../db';
import type {GetOutput, UpdateEvents} from '../../util/types';

async function updateTeams(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        const teams = await getCopy.teams({
            seasonAttrs: ["won", "lost"],
            stats: ["fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts"],
            season: inputs.season,
        });

        const statsAll = teams.reduce((memo, t) => {
            for (const cat of ['seasonAttrs', 'stats']) {
                for (const stat of Object.keys(t[cat])) {
                    if (memo.hasOwnProperty(stat)) {
                        memo[stat].push(t[cat][stat]);
                    } else {
                        memo[stat] = [t[cat][stat]];
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

export default {
    runBefore: [updateTeams],
};
