// @flow

import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import type { GetOutput, UpdateEvents } from "../../../deion/common/types";

async function updateHistory(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    const { season } = inputs;
    if (typeof season !== "number") {
        return;
    }

    if (updateEvents.includes("firstRun") || state.season !== season) {
        if (season < g.startingSeason) {
            return {
                invalidSeason: true,
                season,
            };
        }

        const [awards, teams] = await Promise.all([
            idb.getCopy.awards({ season }),
            idb.getCopies.teamsPlus({
                attrs: ["tid", "abbrev", "region", "name"],
                seasonAttrs: ["playoffRoundsWon"],
                season,
            }),
        ]);

        // Hack placeholder for old seasons before Finals MVP existed
        if (awards && !awards.hasOwnProperty("finalsMvp")) {
            awards.finalsMvp = {
                pid: 0,
                name: "N/A",
                tid: -1,
                abbrev: "",
                pts: 0,
                trb: 0,
                ast: 0,
            };
        }

        // Hack placeholder for old seasons before Finals MVP existed
        if (awards && !awards.hasOwnProperty("allRookie")) {
            // $FlowFixMe
            awards.allRookie = [];
        }

        // For old league files, this format is obsolete now
        if (awards && awards.bre && awards.brw) {
            // $FlowFixMe
            awards.bestRecordConfs = [awards.bre, awards.brw];
        }

        let retiredPlayers = await idb.getCopies.players({
            retired: true,
            filter: p => p.retiredYear === season,
        });
        retiredPlayers = await idb.getCopies.playersPlus(retiredPlayers, {
            attrs: ["pid", "name", "age", "hof"],
            season,
            stats: ["tid", "abbrev"],
            showNoStats: true,
        });
        retiredPlayers.sort((a, b) => b.age - a.age);

        // Get champs
        const champ = teams.find(
            t =>
                t.seasonAttrs.playoffRoundsWon ===
                g.numGamesPlayoffSeries.length,
        );

        return {
            awards,
            champ,
            confs: g.confs,
            invalidSeason: false,
            retiredPlayers,
            season,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updateHistory],
};
