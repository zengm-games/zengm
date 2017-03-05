// @flow

import {g, helpers} from '../../common';
import {getCopy} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateStandings(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if ((inputs.season === g.season && updateEvents.includes('gameSim')) || inputs.season !== state.season) {
        const teams = helpers.orderByWinp(await getCopy.teams({
            attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
            seasonAttrs: ["won", "lost", "winp", "wonHome", "lostHome", "wonAway", "lostAway", "wonDiv", "lostDiv", "wonConf", "lostConf", "lastTen", "streak"],
            season: inputs.season,
        }));

        const numPlayoffTeams = 2 ** g.numPlayoffRounds;

        const confs = [];
        for (let i = 0; i < g.confs.length; i++) {
            const playoffsRank = [];
            const confTeams = [];
            let j = 0;
            for (const t of teams) {
                if (g.confs[i].cid === t.cid) {
                    playoffsRank[t.tid] = j + 1; // Store ranks by tid, for use in division standings
                    confTeams.push(helpers.deepCopy(t));
                    confTeams[j].rank = j + 1;
                    if (j === 0) {
                        confTeams[j].gb = 0;
                    } else {
                        confTeams[j].gb = helpers.gb(confTeams[0].seasonAttrs, confTeams[j].seasonAttrs);
                    }
                    if (confTeams[j].tid === g.userTid) {
                        confTeams[j].highlight = true;
                    } else {
                        confTeams[j].highlight = false;
                    }
                    j += 1;
                }
            }

            confs.push({cid: g.confs[i].cid, name: g.confs[i].name, divs: [], teams: confTeams});

            for (const div of g.divs) {
                if (div.cid === g.confs[i].cid) {
                    const divTeams = [];
                    let k = 0;
                    for (const t of teams) {
                        if (div.did === t.did) {
                            divTeams.push(helpers.deepCopy(t));
                            if (k === 0) {
                                divTeams[k].gb = 0;
                            } else {
                                divTeams[k].gb = helpers.gb(divTeams[0].seasonAttrs, divTeams[k].seasonAttrs);
                            }

                            if (playoffsRank[divTeams[k].tid] <= numPlayoffTeams / 2) {
                                divTeams[k].playoffsRank = playoffsRank[divTeams[k].tid];
                            } else {
                                divTeams[k].playoffsRank = null;
                            }

                            if (divTeams[k].tid === g.userTid) {
                                divTeams[k].highlight = true;
                            } else {
                                divTeams[k].highlight = false;
                            }

                            k += 1;
                        }
                    }

                    confs[i].divs.push({did: div.did, name: div.name, teams: divTeams});
                }
            }
        }

        const playoffsByConference = g.confs.length === 2;// && !localStorage.getItem('top16playoffs');

        // Fix playoffsRank if conferences don't matter
        if (!playoffsByConference) {
            for (let i = 0; i < teams.length; i++) {
                const t = teams[i];
                const div = confs[t.cid].divs.find(div2 => t.did === div2.did);
                if (div) {
                    const t2 = div.teams.find(t3 => t.tid === t3.tid);
                    if (t2) {
                        t2.playoffsRank = i < numPlayoffTeams ? i + 1 : null;
                    }
                }
            }
        }

        return {
            confs,
            playoffsByConference,
            season: inputs.season,
        };
    }
}

export default {
    runBefore: [updateStandings],
};
