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
import { g, helpers } from "../../../../deion/worker/util";
import type {
    Conditions,
    PlayerFiltered,
} from "../../../../deion/common/types";
import type {
    AwardsByPlayer,
    GetTopPlayersOptions,
} from "../../../../deion/worker/core/season/awards";
import type {
    AwardPlayer,
    AwardPlayerDefense,
    Awards,
} from "../../../common/types";

const getPlayerInfoOffense = (p: PlayerFiltered): AwardPlayer => {
    return {
        pid: p.pid,
        name: p.name,
        tid: p.tid,
        abbrev: p.abbrev,
        pts: p.currentStats.pts,
        trb: p.currentStats.trb,
        ast: p.currentStats.ast,
    };
};

const getPlayerInfoDefense = (p: PlayerFiltered): AwardPlayerDefense => {
    return {
        pid: p.pid,
        name: p.name,
        tid: p.tid,
        abbrev: p.abbrev,
        trb: p.currentStats.trb,
        blk: p.currentStats.blk,
        stl: p.currentStats.stl,
    };
};

const getTopPlayersOffense = (
    options: GetTopPlayersOptions,
    playersUnsorted: PlayerFiltered[],
): AwardPlayer[] => {
    return getTopPlayers(options, playersUnsorted).map(getPlayerInfoOffense);
};
const getTopPlayersDefense = (
    options: GetTopPlayersOptions,
    playersUnsorted: PlayerFiltered[],
): AwardPlayerDefense[] => {
    return getTopPlayers(options, playersUnsorted).map(getPlayerInfoDefense);
};

const makeTeams = <T>(
    players: T[],
): [
    { title: "First Team", players: [T, T, T, T, T] },
    { title: "Second Team", players: [T, T, T, T, T] },
    { title: "Third Team", players: [T, T, T, T, T] },
] => {
    return [
        {
            title: "First Team",
            players: [
                // Can't use Array.slice because of Flow https://flow.org/en/docs/types/tuples/#toc-tuples-don-t-match-array-types
                players[0],
                players[1],
                players[2],
                players[3],
                players[4],
            ],
        },
        {
            title: "Second Team",
            players: [
                players[5],
                players[6],
                players[7],
                players[8],
                players[9],
            ],
        },
        {
            title: "Third Team",
            players: [
                players[10],
                players[11],
                players[12],
                players[13],
                players[14],
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
            tid: number,
            pts: number,
            trb: number,
            ast: number,
        },
    > = new Map();
    for (const game of finalsGames) {
        for (const t of game.teams) {
            for (const p of t.players) {
                const info = playerInfos.get(p.pid) || {
                    pid: p.pid,
                    score: 0,
                    tid: t.tid,
                    pts: 0,
                    trb: 0,
                    ast: 0,
                };

                // 50% bonus for the winning team
                const factor = t.tid === champTid ? 1.5 : 1;
                info.score += factor * helpers.gameScore(p);

                info.pts += p.pts;
                info.trb += p.drb + p.orb;
                info.ast += p.ast;

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
            pts: playerArray[0].pts / finalsGames.length,
            trb: playerArray[0].trb / finalsGames.length,
            ast: playerArray[0].ast / finalsGames.length,
        };
    }
};

/**
 * Compute the awards (MVP, etc) after a season finishes.
 *
 * The awards are saved to the "awards" object store.
 *
 * @memberOf core.season
 * @return {Promise}
 */
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

    const categories = [
        { name: "League Scoring Leader", stat: "pts", minValue: 1400 },
        { name: "League Rebounding Leader", stat: "trb", minValue: 800 },
        { name: "League Assists Leader", stat: "ast", minValue: 400 },
        { name: "League Steals Leader", stat: "stl", minValue: 125 },
        { name: "League Blocks Leader", stat: "blk", minValue: 100 },
    ];
    leagueLeaders(players, categories, awardsByPlayer);

    const mvpScore = (p: PlayerFiltered) =>
        p.currentStats.ewa + p.currentStats.ws;

    const mvpPlayers = getTopPlayersOffense(
        {
            amount: 15,
            score: mvpScore,
        },
        players,
    );
    const mvp = mvpPlayers[0];
    const allLeague = makeTeams(mvpPlayers);

    const [smoy] = getTopPlayersOffense(
        {
            filter: p =>
                p.currentStats.gs === 0 ||
                p.currentStats.gp / p.currentStats.gs > 2,
            score: mvpScore,
        },
        players,
    );

    const royPlayers = getTopPlayersOffense(
        {
            allowNone: true,
            amount: 5,
            filter: p => {
                // This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
                return p.draft.year === g.season - 1;
            },
            score: mvpScore,
        },
        players,
    );
    // Unlike mvp and allLeague, roy can be undefined and allRookie can be any length <= 5
    const roy = royPlayers[0];
    const allRookie = royPlayers.slice(0, 5);

    const dpoyPlayers: AwardPlayerDefense[] = getTopPlayersDefense(
        {
            amount: 15,
            score: (p: PlayerFiltered) =>
                p.currentStats.dws + p.currentStats.blk + p.currentStats.stl,
        },
        players,
    );
    const dpoy = dpoyPlayers[0];
    const allDefensive = makeTeams(dpoyPlayers);

    const mipFactor = g.numGames * Math.sqrt(g.quarterLength / 12);
    const [mip] = getTopPlayersOffense(
        {
            filter: p => {
                // Too many second year players get picked, when it's expected for them to improve (undrafted and second round picks can still win)
                if (p.draft.year + 2 >= g.season && p.draft.round === 1) {
                    return false;
                }

                // Must have stats last year!
                const oldStatsAll = p.stats.filter(
                    ps => ps.season === g.season - 1,
                );
                if (oldStatsAll.length === 0) {
                    return false;
                }

                // Sanity check, needed with PER, and easier to do here rather than in filter
                const oldStats = oldStatsAll[oldStatsAll.length - 1];
                if (
                    p.currentStats.min * p.currentStats.gp < 5 * mipFactor ||
                    oldStats.min * oldStats.gp < 5 * mipFactor
                ) {
                    return false;
                }

                return true;
            },
            score: p => {
                const oldStatsAll = p.stats.filter(
                    ps => ps.season === g.season - 1,
                );
                const oldStats = oldStatsAll[oldStatsAll.length - 1];

                const ewaAllPrev = p.stats.slice(0, -1).map(ps => ps.ewa);

                const min = p.currentStats.min * p.currentStats.gp;
                const minOld = oldStats.min * oldStats.gp;
                const ewa = p.currentStats.ewa;
                const ewaOld = oldStats.ewa;
                const ewaMax = Math.max(...ewaAllPrev);
                const per = p.currentStats.per;
                const perOld = oldStats.per;

                // Increasing WS by 5 is equal weight to increasing WS/48 by 0.1
                // Transltaed to PER/EWA by guessing
                let score = 0.02 * (ewa - ewaOld) + 0.03 * (per - perOld);

                // Penalty - lose 0.05 for every mpg last season under 15
                if (minOld < 15 * mipFactor) {
                    score -= 0.05 * (15 * mipFactor - minOld / g.numGames);
                }

                // Penalty - lose additional 0.05 for every mpg last season under 10
                if (minOld < 15 * mipFactor) {
                    score -= 0.05 * (15 * mipFactor - minOld / g.numGames);
                }

                // Penalty - lose 0.01 for every mpg this season under 30
                if (min < 30 * mipFactor) {
                    score -= 0.01 * (30 * mipFactor - min / g.numGames);
                }

                // Penalty - baseline required is 125% of previous best season. Lose 0.01 for every 1% below that.
                if (ewa < 1.25 * ewaMax) {
                    let ratio = 1;
                    if (ewaMax !== 0) {
                        ratio = ewa / ewaMax;
                    }

                    // Sanity check... don't want two negative numbers blowing up the ratio
                    if (ratio < 0 || (ewa < 0 && ewaMax < 0)) {
                        ratio = 0;
                    }

                    score -= 1.25 - ratio;
                }

                return score;
            },
        },
        players,
    );

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

        // If for some reason there is no Finals MVP (like if the finals box scores were not found), use total playoff stats
        if (finalsMvp === undefined) {
            [finalsMvp] = getTopPlayersOffense(
                {
                    score: mvpScore,
                },
                champPlayers,
            );
        }
    }

    const awards: Awards = {
        bestRecord,
        bestRecordConfs,
        mvp,
        dpoy,
        smoy,
        mip,
        roy,
        finalsMvp,
        allLeague,
        allDefensive,
        allRookie,
        season: g.season,
    };

    const awardNames = {
        mvp: "Most Valuable Player",
        roy: "Rookie of the Year",
        smoy: "Sixth Man of the Year",
        dpoy: "Defensive Player of the Year",
        mip: "Most Improved Player",
        finalsMvp: "Finals MVP",
        allLeague: "All-League",
        allDefensive: "All-Defensive",
        allRookie: "All Rookie Team",
    };

    const simpleAwards = ["mvp", "roy", "smoy", "dpoy", "mip", "finalsMvp"];
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
    for (const key of ["allRookie", "allLeague", "allDefensive"]) {
        const type = awardNames[key];
        if (key === "allRookie") {
            for (const { pid, tid, name } of awards.allRookie) {
                awardsByPlayer.push({
                    pid,
                    tid,
                    name,
                    type,
                });
            }
        } else {
            for (const level of awards[key]) {
                for (const { pid, tid, name } of level.players) {
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
