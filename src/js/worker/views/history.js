// @flow

import {g} from '../../common';
import {getCopy} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateHistory(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    const {season} = inputs;
    if (typeof season !== 'number') {
        return;
    }

    if (updateEvents.includes('firstRun') || state.season !== season) {
        if (season < g.startingSeason) {
            return {
                invalidSeason: true,
                season,
            };
        }

        const [awards, teams] = await Promise.all([
            getCopy.awards({season}),
            getCopy.teams({
                attrs: ["tid", "abbrev", "region", "name"],
                seasonAttrs: ["playoffRoundsWon"],
                season,
            }),
        ]);

        // Hack placeholder for old seasons before Finals MVP existed
        if (!awards.hasOwnProperty("finalsMvp")) {
            awards.finalsMvp = {
                pid: 0,
                name: "N/A",
                pts: 0,
                trb: 0,
                ast: 0,
            };
        }

        // Hack placeholder for old seasons before Finals MVP existed
        if (!awards.hasOwnProperty("allRookie")) {
            awards.allRookie = [];
        }

        // For old league files, this format is obsolete now
        if (awards.bre && awards.brw) {
            awards.bestRecordConfs = [awards.bre, awards.brw];
        }

        let retiredPlayers = await getCopy.players({retired: true});
        retiredPlayers = retiredPlayers.filter((p) => p.retiredYear === season);
        retiredPlayers = await getCopy.playersPlus(retiredPlayers, {
            attrs: ["pid", "name", "age", "hof"],
            season,
            stats: ["tid", "abbrev"],
            showNoStats: true,
        });
        for (let i = 0; i < retiredPlayers.length; i++) {
            // Show age at retirement, not current age
            retiredPlayers[i].age -= g.season - season;
        }
        retiredPlayers.sort((a, b) => b.age - a.age);

        // Get champs
        const champ = teams.find((t) => t.seasonAttrs.playoffRoundsWon === g.numPlayoffRounds);

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
