// @flow

import g from '../../globals';
import {getCopy} from '../db';

async function updateTeamInfo(): void | {[key: string]: any} {
    const teams = await getCopy.teams({
        attrs: ["tid", "abbrev", "region", "name", "imgURL"],
        seasonAttrs: ["pop"],
        season: g.season,
    });

    for (let i = 0; i < teams.length; i++) {
        teams[i].pop = parseFloat(teams[i].seasonAttrs.pop.toFixed(6));
    }

    return {
        godMode: g.godMode,
        teams,
    };
}

export default {
    runBefore: [updateTeamInfo],
};
