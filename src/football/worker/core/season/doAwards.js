// @flow

import orderBy from "lodash/orderBy";
import {
    getPlayers,
    getTopPlayers,
    leagueLeaders,
    saveAwardsByPlayer,
    teamAwards,
} from "../../../../deion/worker/core/season/awards";
import { idb } from "../../../../deion/worker/db";
import { g } from "../../../../deion/worker/util";
import type {
    Conditions,
    PlayerFiltered,
} from "../../../../deion/common/types";
import type { AwardsByPlayer } from "../../../../deion/worker/core/season/awards";
import type { AwardPlayer, Awards } from "../../../common/types";

const getPlayerInfo = (p: PlayerFiltered): AwardPlayer => {
    return {
        pid: p.pid,
        name: p.name,
        pos: p.pos,
        tid: p.tid,
        abbrev: p.abbrev,
        keyStats: p.currentStats.keyStats,
    };
};

const getTopByPos = (
    players: PlayerFiltered[],
    positions?: string[],
    usedPids?: Set<number>,
) => {
    for (const p of players) {
        if (usedPids) {
            if (usedPids.has(p.pid)) {
                continue;
            }
        }

        if (positions === undefined || positions.includes(p.pos)) {
            if (usedPids) {
                usedPids.add(p.pid);
            }

            return getPlayerInfo(p);
        }
    }
};

const makeTeams = (
    players: PlayerFiltered[],
    rookie?: boolean = false,
): any => {
    const usedPids = new Set<number>();

    const teamPositions = [
        ["QB"],
        ["RB"],
        ["RB", "WR"],
        ["WR"],
        ["WR"],
        ["TE"],
        ["OL"],
        ["OL"],
        ["OL"],
        ["OL"],
        ["OL"],
        ["DL"],
        ["DL"],
        ["DL"],
        ["DL"],
        ["LB"],
        ["LB"],
        ["LB"],
        ["S"],
        ["S"],
        ["CB"],
        ["CB"],
    ];

    const kickers = getTopPlayers(
        {
            allowNone: rookie,
            amount: 2,
            score: (p: PlayerFiltered) => p.currentStats.fg,
        },
        players,
    );
    const punters = getTopPlayers(
        {
            allowNone: rookie,
            amount: 2,
            score: (p: PlayerFiltered) => p.currentStats.pntYds,
        },
        players,
    );
    const kickReturners = getTopPlayers(
        {
            allowNone: rookie,
            amount: 2,
            score: (p: PlayerFiltered) =>
                p.currentStats.krYds + 500 * p.currentStats.krTD,
        },
        players,
    );
    const puntReturners = getTopPlayers(
        {
            allowNone: rookie,
            amount: 2,
            score: (p: PlayerFiltered) =>
                p.currentStats.prYds + 500 * p.currentStats.prTD,
        },
        players,
    );

    if (rookie) {
        return [
            ...teamPositions.map(positions =>
                getTopByPos(players, positions, usedPids),
            ),
            kickers[0],
            punters[0],
            kickReturners[0],
            puntReturners[0],
        ];
    }

    return [
        {
            title: "First Team",
            players: [
                ...teamPositions.map(positions =>
                    getTopByPos(players, positions, usedPids),
                ),
                kickers[0],
                punters[0],
                kickReturners[0],
                puntReturners[0],
            ],
        },
        {
            title: "Second Team",
            players: [
                ...teamPositions.map(positions =>
                    getTopByPos(players, positions, usedPids),
                ),
                kickers[1],
                punters[1],
                kickReturners[1],
                puntReturners[1],
            ],
        },
    ];
};

const getRealFinalsMvp = async (
    players: PlayerFiltered[],
    champTid: number,
): Promise<AwardPlayer | void> => {
    const games = await idb.cache.games.getAll();

    // Last game of the season will have the two finals teams
    const finalsTids = games[games.length - 1].teams.map(t => t.tid);

    // Get all playoff games between those two teams - that will be all finals games
    const finalsGames = games.filter(
        game =>
            game.playoffs &&
            finalsTids.includes(game.teams[0].tid) &&
            finalsTids.includes(game.teams[1].tid),
    );
    if (finalsGames.length === 0) {
        return;
    }

    // Calculate sum of game scores for each player
    const playerInfos: Map<
        number,
        {
            pid: number,
            score: number,
        },
    > = new Map();
    for (const game of finalsGames) {
        for (const t of game.teams) {
            for (const p of t.players) {
                const info = playerInfos.get(p.pid) || {
                    pid: p.pid,
                    score: 0,
                };

                // 50% bonus for the winning team
                const factor = t.tid === champTid ? 1.5 : 1;

                const ydsFromScrimmage = p.recYds + p.rusYds;
                const otherTD =
                    p.recTD +
                    p.rusTD +
                    p.prTD +
                    p.krTD +
                    p.defIntTD +
                    p.defFmbTD;

                info.score +=
                    factor *
                    (p.pssYds / 25 +
                        4 * p.pssTD +
                        ydsFromScrimmage / 10 +
                        6 * otherTD);

                playerInfos.set(p.pid, info);
            }
        }
    }
    const playerArray = orderBy(
        Array.from(playerInfos.values()),
        "score",
        "desc",
    );
    if (playerArray.length === 0) {
        return;
    }

    const { pid } = playerArray[0];

    const p = players.find(p2 => p2.pid === pid);
    if (p) {
        return {
            pid: p.pid,
            name: p.name,
            tid: p.tid,
            abbrev: p.abbrev,
            pos: p.pos,
            keyStats: "",
        };
    }
};

const doAwards = async (conditions: Conditions) => {
    // Careful - this array is mutated in various functions called below
    const awardsByPlayer: AwardsByPlayer = [];

    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid", "abbrev", "region", "name", "cid"],
        seasonAttrs: ["won", "lost", "tied", "winp", "playoffRoundsWon"],
        season: g.season,
    });
    const players = await getPlayers();

    const { bestRecord, bestRecordConfs } = teamAwards(teams);

    leagueLeaders(players, [], awardsByPlayer);

    const avScore = (p: PlayerFiltered) => p.currentStats.av;

    const avPlayers = getTopPlayers(
        {
            amount: Infinity,
            score: avScore,
        },
        players,
    );

    const mvp = getTopByPos(avPlayers);
    const dpoy = getTopByPos(avPlayers, ["DL", "LB", "S", "CB"]);
    const allLeague = makeTeams(avPlayers);

    const royPlayers = getTopPlayers(
        {
            allowNone: true,
            amount: Infinity,
            filter: p => {
                // This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
                return p.draft.year === g.season - 1;
            },
            score: avScore,
        },
        players,
    );
    const oroy = getTopByPos(royPlayers, ["QB", "RB", "WR", "TE", "OL"]);
    const droy = getTopByPos(royPlayers, ["DL", "LB", "S", "CB"]);

    const allRookie = makeTeams(royPlayers, true);

    let finalsMvp;
    const champTeam = teams.find(
        t => t.seasonAttrs.playoffRoundsWon === g.numGamesPlayoffSeries.length,
    );
    if (champTeam) {
        const champTid = champTeam.tid;

        let champPlayers = await idb.cache.players.indexGetAll(
            "playersByTid",
            champTid,
        ); // Alternatively, could filter original players array by tid, but still need playersPlus to fill in playoff stats
        champPlayers = await idb.getCopies.playersPlus(champPlayers, {
            // Only the champions, only playoff stats
            attrs: ["pid", "name", "tid", "abbrev"],
            stats: ["pts", "trb", "ast", "ws", "ewa"],
            season: g.season,
            playoffs: true,
            regularSeason: false,
            tid: champTid,
        });

        // For symmetry with players array
        for (const p of champPlayers) {
            p.currentStats = p.stats;
        }

        finalsMvp = await getRealFinalsMvp(players, champTid);
    }

    const awards: Awards = {
        bestRecord,
        bestRecordConfs,
        mvp,
        dpoy,
        oroy,
        droy,
        finalsMvp,
        allLeague,
        allRookie,
        season: g.season,
    };

    const awardNames = {
        mvp: "Most Valuable Player",
        dpoy: "Defensive Player of the Year",
        oroy: "Offensive Rookie of the Year",
        droy: "Defensive Rookie of the Year",
        finalsMvp: "Finals MVP",
        allLeague: "All-League",
        allRookie: "All Rookie Team",
    };

    const simpleAwards = ["mvp", "dpoy", "oroy", "droy", "finalsMvp"];
    for (const key of simpleAwards) {
        const type = awardNames[key];
        const award = awards[key];

        if (award === undefined) {
            // e.g. MIP in first season
            continue;
        }

        const { pid, tid, name } = award;
        awardsByPlayer.push({
            pid,
            tid,
            name,
            type,
        });
    }

    // Special cases for teams
    for (const key of ["allRookie", "allLeague"]) {
        const type = awardNames[key];
        if (key === "allRookie") {
            for (const award of awards.allRookie) {
                if (award === undefined) {
                    continue;
                }
                const { pid, tid, name } = award;
                awardsByPlayer.push({
                    pid,
                    tid,
                    name,
                    type,
                });
            }
        } else {
            for (const level of awards[key]) {
                for (const award of level.players) {
                    if (award === undefined) {
                        continue;
                    }
                    const { pid, tid, name } = award;
                    awardsByPlayer.push({
                        pid,
                        tid,
                        name,
                        type: `${level.title} ${type}`,
                    });
                }
            }
        }
    }

    await idb.cache.awards.put(awards);
    await saveAwardsByPlayer(awardsByPlayer, conditions);
};

export default doAwards;
