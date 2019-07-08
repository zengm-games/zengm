// @flow

import { idb } from "../db";
import { g } from "../util";

async function updateTeamInfo(): void | { [key: string]: any } {
    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid", "abbrev", "region", "name", "imgURL"],
        seasonAttrs: ["pop", "stadiumCapacity"],
        season: g.season,
    });

    for (const t of teams) {
        t.pop = parseFloat(t.seasonAttrs.pop.toFixed(6));
        t.stadiumCapacity = t.seasonAttrs.stadiumCapacity;
        delete t.seasonAttrs;
    }

    return {
        defaultStadiumCapacity: g.defaultStadiumCapacity,
        confs: g.confs,
        divs: g.divs,
        godMode: g.godMode,
        numTeams: g.numTeams,
        phase: g.phase,
        teams,
    };
}

export default {
    runBefore: [updateTeamInfo],
};
