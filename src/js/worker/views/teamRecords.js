import range from "lodash/range";
import { g } from "../../common";
import { idb } from "../db";
import type { UpdateEvents } from "../../common/types";

function getTeamRecord(t, awards) {
    let totalWon = 0;
    let totalLost = 0;
    let playoffAppearances = 0;
    let championships = 0;
    let finals = 0;
    let lastPlayoffAppearance = null;
    let lastChampionship = null;
    for (let i = 0; i < t.seasonAttrs.length; i++) {
        totalWon += t.seasonAttrs[i].won;
        totalLost += t.seasonAttrs[i].lost;
        if (t.seasonAttrs[i].playoffRoundsWon >= 0) {
            playoffAppearances++;
            lastPlayoffAppearance = t.seasonAttrs[i].season;
        }
        if (t.seasonAttrs[i].playoffRoundsWon >= g.numPlayoffRounds - 1) {
            finals++;
        }
        if (t.seasonAttrs[i].playoffRoundsWon === g.numPlayoffRounds) {
            championships++;
            lastChampionship = t.seasonAttrs[i].season;
        }
    }

    const totalWP =
        totalWon > 0 ? (totalWon / (totalWon + totalLost)).toFixed(3) : "0.000";

    return {
        id: t.tid,
        team: {
            abbrev: t.abbrev,
            name: t.name,
            region: t.region,
        },
        cid: t.cid,
        did: t.did,
        won: totalWon,
        lost: totalLost,
        winp: totalWP.slice(1),
        playoffAppearances,
        lastPlayoffAppearance,
        championships,
        lastChampionship,
        finals,
        mvp: awards[t.tid] ? awards[t.tid].mvp : 0,
        dpoy: awards[t.tid] ? awards[t.tid].dpoy : 0,
        smoy: awards[t.tid] ? awards[t.tid].smoy : 0,
        roy: awards[t.tid] ? awards[t.tid].roy : 0,
        bestRecord: awards[t.tid] ? awards[t.tid].bestRecord : 0,
        bestRecordConf: awards[t.tid] ? awards[t.tid].bestRecordConf : 0,
        allRookie: awards[t.tid] ? awards[t.tid].allRookie : 0,
        allLeague: awards[t.tid] ? awards[t.tid].allLeagueTotal : 0,
        allDefense: awards[t.tid] ? awards[t.tid].allDefenseTotal : 0,
    };
}

function tallyAwards(awards) {
    const teams = range(g.numTeams).map(() => {
        return {
            mvp: 0,
            dpoy: 0,
            smoy: 0,
            roy: 0,
            allLeague: [0, 0, 0],
            allLeagueTotal: 0,
            allDefense: [0, 0, 0],
            allDefenseTotal: 0,
            allRookie: 0,
            bestRecord: 0,
            bestRecordConf: 0,
        };
    });

    for (const a of awards) {
        if (!a) {
            continue;
        }

        if (teams[a.mvp.tid]) {
            teams[a.mvp.tid].mvp++;
        }
        if (teams[a.dpoy.tid]) {
            teams[a.dpoy.tid].dpoy++;
        }
        if (teams[a.smoy.tid]) {
            teams[a.smoy.tid].smoy++;
        }
        if (teams[a.roy.tid]) {
            teams[a.roy.tid].roy++;
        }
        if (a.bre && a.brw) {
            // For old league files, this format is obsolete now
            if (teams[a.bre.tid]) {
                teams[a.bre.tid].bestRecordConf++;
            }
            if (teams[a.brw.tid]) {
                teams[a.brw.tid].bestRecordConf++;
            }
            if (a.bre.won >= a.brw.won) {
                if (teams[a.bre.tid]) {
                    teams[a.bre.tid].bestRecord++;
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (teams[a.brw.tid]) {
                    teams[a.brw.tid].bestRecord++;
                }
            }
        } else {
            for (const t of a.bestRecordConfs) {
                if (teams[t.tid]) {
                    teams[t.tid].bestRecordConf++;
                }
            }
            if (teams[a.bestRecord.tid]) {
                teams[a.bestRecord.tid].bestRecord++;
            }

            for (let i = 0; i < a.allRookie.length; i++) {
                if (teams[a.allRookie[i].tid]) {
                    teams[a.allRookie[i].tid].allRookie++;
                }
            }
        }

        for (let i = 0; i < a.allLeague.length; i++) {
            for (const p of a.allLeague[i].players) {
                // https://www.reddit.com/r/BasketballGM/comments/6i80ph/weird_error_message_while_viewing_certain_pages/
                if (teams[p.tid]) {
                    teams[p.tid].allLeague[i]++;
                    teams[p.tid].allLeagueTotal++;
                }
            }
        }

        for (let i = 0; i < a.allDefensive.length; i++) {
            for (const p of a.allDefensive[i].players) {
                // https://www.reddit.com/r/BasketballGM/comments/6i80ph/weird_error_message_while_viewing_certain_pages/
                if (teams[p.tid]) {
                    teams[p.tid].allDefense[i]++;
                    teams[p.tid].allDefenseTotal++;
                }
            }
        }
    }

    return teams;
}

function sumRecordsFor(group, id, name, records) {
    const except = [
        "id",
        "lastChampionship",
        "lastPlayoffAppearance",
        "team",
        "cid",
        "did",
        "winp",
    ];
    const keys = Object.keys(records[0]);
    const out = {};

    const xRecords = records.filter(r => r[group] === id);

    for (const k of keys) {
        if (except.includes(k)) {
            out[k] = null;
        } else {
            out[k] = xRecords.reduce((a, b) => a + Number(b[k]), 0);
        }
    }
    out.id = id;
    out.team = name;
    out.winp = String(out.won / (out.won + out.lost));
    out.winp =
        out.won > 0
            ? (Number(out.won) / (Number(out.won) + Number(out.lost))).toFixed(
                  3,
              )
            : "0.000";
    return out;
}

async function updateTeamRecords(
    inputs: { byType: string },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (updateEvents.includes("firstRun") || inputs.byType !== state.byType) {
        const [teams, awards] = await Promise.all([
            idb.getCopies.teamsPlus({
                attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
                seasonAttrs: ["season", "playoffRoundsWon", "won", "lost"],
            }),
            idb.getCopies.awards(),
        ]);

        const awardsPerTeam = tallyAwards(awards);
        const teamRecords = [];
        for (let i = 0; i < teams.length; i++) {
            teamRecords.push(getTeamRecord(teams[i], awardsPerTeam));
        }
        const seasonCount = teamRecords
            .map(tr => tr.championships)
            .reduce((a, b) => Number(a) + Number(b));

        let display;
        let displayName;
        if (inputs.byType === "team") {
            display = teamRecords;
            displayName = "Team";
        } else if (inputs.byType === "conf") {
            display = g.confs.map(conf =>
                sumRecordsFor("cid", conf.cid, conf.name, teamRecords),
            );
            displayName = "Conference";
        } else {
            display = g.divs.map(div =>
                sumRecordsFor("did", div.did, div.name, teamRecords),
            );
            displayName = "Division";
        }

        return {
            teamRecords: display,
            displayName,
            seasonCount,
            byType: inputs.byType,
        };
    }
}

export default {
    runBefore: [updateTeamRecords],
};
