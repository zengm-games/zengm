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
                    confTeams[j].playoffStatusCode = null;
                    if (j === 0) {
                        confTeams[j].gb = 0;
                    } else {
                        confTeams[j].gb = helpers.gb(
                            confTeams[0].seasonAttrs,
                            confTeams[j].seasonAttrs,
                        );
                    }
                    confTeams[j].highlight = confTeams[j].tid === g.userTid;

                    if (j >= numPlayoffTeams / 2) {
                        //only look at teams currently outside of playoff picture
                        if (
                            helpers.magicNumber(
                                confTeams[numPlayoffTeams / 2 - 1].seasonAttrs,
                                confTeams[j].seasonAttrs,
                            ) === 0
                        ) {
                            //if current team (outside of playoff picture) has masgic num of 0 vs last team in playoff picture, elim outsider
                            confTeams[j].playoffStatusCode = -1;

                            if (j === numPlayoffTeams / 2) {
                                //set last team in playoff picture into playoffs, ONLY if Magic Number of 0 when comparing to next worst team. Example - #8 team in conf has MagicNum of 0 vs #9 team.
                                confTeams[j - 1].playoffStatusCode = Math.max(
                                    confTeams[j - 1].playoffStatusCode,
                                    1,
                                ); //Do the Max statement in case team has already clinched Conf or Div, and keep the highest/best status
                            }
                        }
                    }

                    j += 1;
                }
            }

            j = 0;
            for (const t of teams) {
                if (g.confs[i].cid === t.cid) {
                    if (j < numPlayoffTeams / 2) {
                        if (
                            helpers.magicNumber(
                                confTeams[j].seasonAttrs,
                                confTeams[numPlayoffTeams / 2].seasonAttrs,
                            ) === 0
                        ) {
                            confTeams[j].playoffStatusCode = Math.max(
                                confTeams[j].playoffStatusCode,
                                1,
                            );
                        }
                    }
                    j += 1;
                }
            }

            confs.push({
                cid: g.confs[i].cid,
                name: g.confs[i].name,
                divs: [],
                teams: playoffsByConference ? confTeams : [],
            });

            if (
                helpers.magicNumber(
                    confTeams[0].seasonAttrs,
                    confTeams[1].seasonAttrs,
                ) === 0
            ) {
                // If #1 team in conference has MagicNum of 0 vs #2 team in conference, #1 team has clinched
                confs[i].teams[0].playoffStatusCode = 3;
            }

            for (const div of g.divs) {
                if (div.cid === g.confs[i].cid) {
                    const divTeams = [];
                    let k = 0;
                    for (const t of teams) {
                        if (div.did === t.did) {
                            divTeams.push(helpers.deepCopy(t));
                            divTeams[k].playoffStatusCode =
                                confs[i].teams[
                                    playoffsRank[divTeams[k].tid] - 1
                                ].playoffStatusCode;
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

                    if (
                        helpers.magicNumber(
                            divTeams[0].seasonAttrs,
                            divTeams[1].seasonAttrs,
                        ) === 0
                    ) {
                        // If #1 team in division has MagicNum of 0 vs #2 team in division, #1 team has clinched
                        confs[i].teams[
                            divTeams[0].playoffsRank - 1
                        ].playoffStatusCode = Math.max(
                            2,
                            confs[i].teams[divTeams[0].playoffsRank - 1]
                                .playoffStatusCode,
                        );
                        divTeams[0].playoffStatusCode = Math.max(
                            2,
                            divTeams[0].playoffStatusCode,
                        );
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
