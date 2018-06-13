// @flow

import { PLAYER } from "../../../common";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";
import type {
    AwardPlayer,
    AwardPlayerDefense,
    Awards,
    Conditions,
    PlayerFiltered,
    TeamFiltered,
} from "../../../common/types";

type AwardsByPlayer = {
    pid: number,
    tid: number,
    name: string,
    type: string,
}[];

const getPlayers = async () => {
    let players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    players = await idb.getCopies.playersPlus(players, {
        attrs: ["pid", "name", "tid", "abbrev", "draft"],
        stats: [
            "gp",
            "gs",
            "min",
            "pts",
            "trb",
            "ast",
            "blk",
            "stl",
            "per",
            "ewa",
            "ws",
            "dws",
            "ws48",
            "season",
        ],
    });

    // Only keep players who actually have a stats entry for the latest season
    players = players.filter(
        p =>
            p.stats.length > 0 &&
            p.stats[p.stats.length - 1].season === g.season,
    );

    // For convenience later
    for (const p of players) {
        p.currentStats = p.stats[p.stats.length - 1];
    }

    return players;
};

const teamAwards = (teamsUnsorted: TeamFiltered[]) => {
    const teams = helpers.orderByWinp(teamsUnsorted);

    if (teams.length === 0) {
        throw new Error("No teams found");
    }

    const bestRecord = {
        tid: teams[0].tid,
        abbrev: teams[0].abbrev,
        region: teams[0].region,
        name: teams[0].name,
        won: teams[0].seasonAttrs.won,
        lost: teams[0].seasonAttrs.lost,
    };

    const bestRecordConfs = g.confs.map(c => {
        const t = teams.find(t2 => t2.cid === c.cid);

        if (!t) {
            throw new Error(`No team found with conference ID ${c.cid}`);
        }

        return {
            tid: t.tid,
            abbrev: t.abbrev,
            region: t.region,
            name: t.name,

            // Flow can't handle complexity of idb.getCopies.teams
            won: t.seasonAttrs ? t.seasonAttrs.won : 0,
            lost: t.seasonAttrs ? t.seasonAttrs.lost : 0,
        };
    });

    return { bestRecord, bestRecordConfs };
};

const leagueLeaders = (
    players: PlayerFiltered[],
    awardsByPlayer: AwardsByPlayer,
) => {
    const factor = (g.numGames / 82) * Math.sqrt(g.quarterLength / 12); // To handle changes in number of games and playing time
    const categories = [
        { name: "League Scoring Leader", stat: "pts", minValue: 1400 },
        { name: "League Rebounding Leader", stat: "trb", minValue: 800 },
        { name: "League Assists Leader", stat: "ast", minValue: 400 },
        { name: "League Steals Leader", stat: "stl", minValue: 125 },
        { name: "League Blocks Leader", stat: "blk", minValue: 100 },
    ];
    for (const cat of categories) {
        const p = players
            .filter(p2 => {
                return (
                    p2.currentStats[cat.stat] * p2.currentStats.gp >=
                        cat.minValue * factor ||
                    p2.currentStats.gp >= 70 * factor
                );
            })
            .reduce((maxPlayer, currentPlayer) => {
                return currentPlayer.currentStats[cat.stat] >
                    maxPlayer.currentStats[cat.stat]
                    ? currentPlayer
                    : maxPlayer;
            }, players[0]);
        if (p) {
            awardsByPlayer.push({
                pid: p.pid,
                tid: p.tid,
                name: p.name,
                type: cat.name,
            });
        }
    }
};

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

type GetTopPlayersOptions = {
    allowNone?: boolean,
    amount?: number,
    filter?: PlayerFiltered => boolean,
    score: PlayerFiltered => number,
};

const getTopPlayers = (
    { allowNone, amount, filter, score }: GetTopPlayersOptions,
    playersUnsorted: PlayerFiltered[],
): PlayerFiltered[] => {
    if (playersUnsorted.length === 0) {
        if (allowNone) {
            return [];
        }
        throw new Error("No players");
    }
    const actualFilter = filter !== undefined ? filter : () => true;
    const actualAmount = amount !== undefined ? amount : 1;

    const cache: Map<number, number> = new Map();
    const players = playersUnsorted.filter(actualFilter).sort((a, b) => {
        let aScore = cache.get(a.pid);
        if (aScore === undefined) {
            aScore = score(a);
            cache.set(a.pid, aScore);
        }

        let bScore = cache.get(b.pid);
        if (bScore === undefined) {
            bScore = score(b);
            cache.set(b.pid, bScore);
        }

        return bScore - aScore;
    });

    // For the ones returning multiple players (for all league teams), enforce length
    if (!allowNone && actualAmount > 1 && players.length < actualAmount) {
        throw new Error("Not enough players");
    }

    // If all players are filtered out above (like MIP initial year), then this will return an empty array
    return players.slice(0, actualAmount);
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

const saveAwardsByPlayer = async (
    awardsByPlayer: AwardsByPlayer,
    conditions: Conditions,
) => {
    // None of this stuff needs to block, it's just notifications
    for (const p of awardsByPlayer) {
        let text = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
            p.name
        }</a> (<a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[p.tid],
            g.season,
        ])}">${g.teamAbbrevsCache[p.tid]}</a>) `;
        if (p.type.includes("Team")) {
            text += `made the ${p.type}.`;
        } else if (p.type.includes("Leader")) {
            text += `led the league in ${p.type
                .replace("League ", "")
                .replace(" Leader", "")
                .toLowerCase()}.`;
        } else {
            text += `won the ${p.type} award.`;
        }
        logEvent(
            {
                type: "award",
                text,
                showNotification: false,
                pids: [p.pid],
                tids: [p.tid],
            },
            conditions,
        );
    }

    const pids = Array.from(new Set(awardsByPlayer.map(award => award.pid)));

    await Promise.all(
        pids.map(async pid => {
            const p = await idb.cache.players.get(pid);
            for (const awardByPlayer of awardsByPlayer) {
                if (awardByPlayer.pid === pid) {
                    p.awards.push({
                        season: g.season,
                        type: awardByPlayer.type,
                    });
                }
            }
            await idb.cache.players.put(p);
        }),
    );
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
        seasonAttrs: ["won", "lost", "winp", "playoffRoundsWon"],
        season: g.season,
    });
    const players = await getPlayers();

    const { bestRecord, bestRecordConfs } = teamAwards(teams);
    leagueLeaders(players, awardsByPlayer);

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
        t => t.seasonAttrs.playoffRoundsWon === g.numPlayoffRounds,
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

        [finalsMvp] = getTopPlayersOffense(
            {
                score: mvpScore,
            },
            champPlayers,
        );
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
