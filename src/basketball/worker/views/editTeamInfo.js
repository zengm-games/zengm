// @flow

import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";

async function updateTeamInfo(): void | { [key: string]: any } {
    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid", "abbrev", "region", "name", "imgURL"],
        seasonAttrs: ["pop", "stadiumCapacity"],
        season: g.season,
    });

    for (let i = 0; i < teams.length; i++) {
        teams[i].pop = parseFloat(teams[i].seasonAttrs.pop.toFixed(6));
        teams[i].stadiumCapacity = teams[i].seasonAttrs.stadiumCapacity;
    }

    return {
        godMode: g.godMode,
        numTeams: g.numTeams,
        teams,
    };
}

export default {
    runBefore: [updateTeamInfo],
};
