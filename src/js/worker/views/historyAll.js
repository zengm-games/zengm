// @flow

import {g} from '../../common';
import {idb} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateHistory(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('firstRun')) {
        const [awards, teams] = await Promise.all([
            idb.getCopies.awards(),
            idb.getCopies.teams({
                attrs: ["tid", "abbrev", "region", "name"],
                seasonAttrs: ["season", "playoffRoundsWon", "won", "lost"],
            }),
        ]);

        const seasons = awards.map(a => {
            return {
                season: a.season,
                finalsMvp: a.finalsMvp,
                mvp: a.mvp,
                dpoy: a.dpoy,
                roy: a.roy,
                runnerUp: undefined,
                champ: undefined,
            };
        });

        teams.forEach(t => {
            // t.seasonAttrs has same season entries as the "seasons" array built from awards
            for (let i = 0; i < seasons.length; i++) {
                // Find corresponding entries in seasons and t.seasonAttrs. Can't assume they are the same because they aren't if some data has been deleted (Improve Performance)
                let found = false;
                let j;
                for (j = 0; j < t.seasonAttrs.length; j++) {
                    if (t.seasonAttrs[j].season === seasons[i].season) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    continue;
                }

                if (t.seasonAttrs[j].playoffRoundsWon === g.numPlayoffRounds) {
                    seasons[i].champ = {
                        tid: t.tid,
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasonAttrs[j].won,
                        lost: t.seasonAttrs[j].lost,
                        count: 0,
                    };
                } else if (t.seasonAttrs[j].playoffRoundsWon === g.numPlayoffRounds - 1) {
                    seasons[i].runnerUp = {
                        tid: t.tid,
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasonAttrs[j].won,
                        lost: t.seasonAttrs[j].lost,
                    };
                }
            }
        });

        // Count up number of championships per team
        const championshipsByTid = [];
        for (let i = 0; i < g.numTeams; i++) {
            championshipsByTid.push(0);
        }
        for (let i = 0; i < seasons.length; i++) {
            if (seasons[i].champ) {
                championshipsByTid[seasons[i].champ.tid] += 1;
                seasons[i].champ.count = championshipsByTid[seasons[i].champ.tid];
            }
        }

        return {
            seasons,
        };
    }
}

export default {
    runBefore: [updateHistory],
};
