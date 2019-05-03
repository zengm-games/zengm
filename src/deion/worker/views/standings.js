// @flow

import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateStandings(
    inputs: { season: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        (inputs.season === g.season && updateEvents.includes("gameSim")) ||
        inputs.season !== state.season
    ) {
        const playoffsByConference = g.confs.length === 2;

        const teams = helpers.orderByWinp(
            await idb.getCopies.teamsPlus({
                attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
                seasonAttrs: [
                    "won",
                    "lost",
                    "tied",
                    "winp",
                    "wonHome",
                    "lostHome",
                    "tiedHome",
                    "wonAway",
                    "lostAway",
                    "tiedAway",
                    "wonDiv",
                    "lostDiv",
                    "tiedDiv",
                    "wonConf",
                    "lostConf",
                    "tiedConf",
                    "lastTen",
                    "streak",
                ],
                season: inputs.season,
            }),
            inputs.season,
        );

        const numPlayoffTeams =
            2 ** g.numGamesPlayoffSeries.length - g.numPlayoffByes;

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
                        confTeams[j].gb = helpers.gb(
                            confTeams[0].seasonAttrs,
                            confTeams[j].seasonAttrs,
                        );
                    }
                    confTeams[j].highlight = confTeams[j].tid === g.userTid;
                    j += 1;
                }
            }

            confs.push({
                cid: g.confs[i].cid,
                name: g.confs[i].name,
                divs: [],
                teams: playoffsByConference ? confTeams : [],
            });

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
                                divTeams[k].gb = helpers.gb(
                                    divTeams[0].seasonAttrs,
                                    divTeams[k].seasonAttrs,
                                );
                            }

                            if (
                                playoffsRank[divTeams[k].tid] <=
                                numPlayoffTeams / 2
                            ) {
                                divTeams[k].playoffsRank =
                                    playoffsRank[divTeams[k].tid];
                            } else {
                                divTeams[k].playoffsRank = null;
                            }

                            divTeams[k].highlight =
                                divTeams[k].tid === g.userTid;

                            k += 1;
                        }
                    }

                    confs[i].divs.push({
                        did: div.did,
                        name: div.name,
                        teams: divTeams,
                    });
                }
            }
        }

        const allTeams = [];
        if (!playoffsByConference) {
            // Fix playoffsRank if conferences don't matter
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

            // If playoffs are not done by conference (instead to 16 or whatever make it from full league), we need a ranked list of all teams to display.
            if (!playoffsByConference) {
                let j = 0;
                for (const t of teams) {
                    allTeams.push(helpers.deepCopy(t));
                    allTeams[j].rank = j + 1;
                    if (j === 0) {
                        allTeams[j].gb = 0;
                    } else {
                        allTeams[j].gb = helpers.gb(
                            allTeams[0].seasonAttrs,
                            allTeams[j].seasonAttrs,
                        );
                    }
                    allTeams[j].highlight = allTeams[j].tid === g.userTid;
                    j += 1;
                }
            }
        }

        return {
            allTeams,
            confs,
            numPlayoffTeams,
            playoffsByConference,
            season: inputs.season,
            ties: g.ties,
        };
    }
}

export default {
    runBefore: [updateStandings],
};
