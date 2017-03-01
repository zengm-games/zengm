// @flow

import {PHASE, g, helpers} from '../../common';
import {season} from '../core';
import {getCopy} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updatePlayoffs(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || inputs.season !== state.season || (inputs.season === g.season && updateEvents.includes('gameSim'))) {
        let finalMatchups;
        let series;

        // If in the current season and before playoffs started, display projected matchups
        if (inputs.season === g.season && g.phase < PHASE.PLAYOFFS) {
            const teams = helpers.orderByWinp(await getCopy.teams({
                attrs: ["tid", "cid", "abbrev", "name"],
                seasonAttrs: ["winp", "won"],
                season: inputs.season,
            }));

            const result = season.genPlayoffSeries(teams);
            series = result.series;

            finalMatchups = false;
        } else {
            const playoffSeries = await getCopy.playoffSeries({season: inputs.season});
            series = playoffSeries.series;

            finalMatchups = true;
        }

        // Formatting for the table in playoffs.html
        const matchups = [];
        for (let i = 0; i < 2 ** (g.numPlayoffRounds - 2); i++) {
            matchups[i] = [];
        }
        // Fill in with each round. Good lord, this is confusing, due to having to assemble it for an HTML table with rowspans.
        for (let i = 0; i < g.numPlayoffRounds; i++) {
            let numGamesInSide = 2 ** (g.numPlayoffRounds - i - 2);
            if (numGamesInSide < 1) {
                numGamesInSide = 1;
            }

            const rowspan = 2 ** i;
            for (let j = 0; j < numGamesInSide; j++) {
                matchups[j * rowspan].splice(i, 0, {
                    rowspan,
                    matchup: [i, j],
                });
                if (g.numPlayoffRounds !== i + 1) {
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
            numPlayoffRounds: g.numPlayoffRounds,
            confNames,
            season: inputs.season,
            series,
        };
    }
}

export default {
    runBefore: [updatePlayoffs],
};
