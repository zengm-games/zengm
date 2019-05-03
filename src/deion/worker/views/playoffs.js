// @flow

import { PHASE } from "../../common";
import { season } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../common/types";

const getProjectedSeries = async (inputSeason: number) => {
    const teams = helpers.orderByWinp(
        await idb.getCopies.teamsPlus({
            attrs: ["tid", "cid", "abbrev", "name"],
            seasonAttrs: ["winp", "won"],
            season: inputSeason,
        }),
        inputSeason,
    );

    // Add entry for wins for each team, delete seasonAttrs just used for sorting
    for (let i = 0; i < teams.length; i++) {
        teams[i].won = 0;
        teams[i].winp = teams[i].seasonAttrs.winp;
        delete teams[i].seasonAttrs;
    }

    const result = season.genPlayoffSeries(teams);

    return result.series;
};

async function updatePlayoffs(
    inputs: { season: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        inputs.season !== state.season ||
        (inputs.season === g.season && updateEvents.includes("gameSim"))
    ) {
        let finalMatchups = false;
        let series;

        // If in the current season and before playoffs started, display projected matchups
        if (inputs.season === g.season && g.phase < PHASE.PLAYOFFS) {
            series = await getProjectedSeries(inputs.season);
        } else {
            const playoffSeries = await idb.getCopy.playoffSeries({
                season: inputs.season,
            });

            if (playoffSeries) {
                series = playoffSeries.series;
                finalMatchups = true;
            } else {
                // Not sure why, but sometimes playoffSeries is undefined here
                series = await getProjectedSeries(inputs.season);
            }
        }

        await helpers.augmentSeries(series);

        // Formatting for the table in playoffs.html
        const matchups = [];
        for (let i = 0; i < 2 ** (series.length - 2); i++) {
            matchups[i] = [];
        }
        // Fill in with each round. Good lord, this is confusing, due to having to assemble it for an HTML table with rowspans.
        for (let i = 0; i < series.length; i++) {
            let numGamesInSide = 2 ** (series.length - i - 2);
            if (numGamesInSide < 1) {
                numGamesInSide = 1;
            }

            const rowspan = 2 ** i;
            for (let j = 0; j < numGamesInSide; j++) {
                matchups[j * rowspan].splice(i, 0, {
                    rowspan,
                    matchup: [i, j],
                });
                if (series.length !== i + 1) {
                    matchups[j * rowspan].splice(i, 0, {
                        rowspan,
                        matchup: [i, numGamesInSide + j],
                    });
                }
            }
        }

        const confNames = g.confs.map(conf => conf.name);

        // Display the current or archived playoffs
        return {
            finalMatchups,
            matchups,
            numGamesToWinSeries: g.numGamesPlayoffSeries.map(
                helpers.numGamesToWinSeries,
            ),
            confNames,
            season: inputs.season,
            series,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updatePlayoffs],
};
