import {g} from '../../common';
import {getCopy} from '../db';

async function updateTeamSelect(): void | {[key: string]: any} {
    let teams = await getCopy.teams({
        attrs: ["tid", "region", "name"],
        seasonAttrs: ["winp"],
        season: g.season,
    });

    // Remove user's team (no re-hiring immediately after firing)
    teams.splice(g.userTid, 1);

    // If not in god mode, user must have been fired
    if (!g.godMode) {
        // Order by worst record
        teams.sort((a, b) => a.seasonAttrs.winp - b.seasonAttrs.winp);

        // Only get option of 5 worst
        teams = teams.slice(0, 5);
    }

    return {
        gameOver: g.gameOver,
        godMode: g.godMode,
        teams,
    };
}

export default {
    runBefore: [updateTeamSelect],
};
