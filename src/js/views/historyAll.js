import Promise from 'bluebird';
import g from '../globals';
import * as team from '../core/team';
import bbgmViewReact from '../util/bbgmViewReact';
import HistoryAll from './views/HistoryAll';

async function updateHistory(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0) {
        const [awards, teams] = await Promise.all([
            g.dbl.awards.getAll(),
            team.filter({
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
            };
        });

        teams.forEach(t => {
            // t.seasons has same season entries as the "seasons" array built from awards
            for (let i = 0; i < seasons.length; i++) {
                // Find corresponding entries in seasons and t.seasons. Can't assume they are the same because they aren't if some data has been deleted (Improve Performance)
                let found = false;
                let j;
                for (j = 0; j < t.seasons.length; j++) {
                    if (t.seasons[j].season === seasons[i].season) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    continue;
                }

                if (t.seasons[j].playoffRoundsWon === g.numPlayoffRounds) {
                    seasons[i].champ = {
                        tid: t.tid,
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasons[j].won,
                        lost: t.seasons[j].lost,
                    };
                } else if (t.seasons[j].playoffRoundsWon === g.numPlayoffRounds - 1) {
                    seasons[i].runnerUp = {
                        tid: t.tid,
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasons[j].won,
                        lost: t.seasons[j].lost,
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

export default bbgmViewReact.init({
    id: "historyAll",
    runBefore: [updateHistory],
    Component: HistoryAll,
});
