// @flow

import { PLAYER } from "../../../common";
import { idb } from "../../db";
import { g, defaultGameAttributes, helpers, logEvent } from "../../util";
import type {
    Conditions,
    PlayerFiltered,
    TeamFiltered,
} from "../../../common/types";

export type AwardsByPlayer = {
    pid: number,
    tid: number,
    name: string,
    type: string,
}[];

export type GetTopPlayersOptions = {
    allowNone?: boolean,
    amount?: number,
    filter?: PlayerFiltered => boolean,
    score: PlayerFiltered => number,
};

const getPlayers = async () => {
    let players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    players = await idb.getCopies.playersPlus(players, {
        attrs: ["pid", "name", "tid", "abbrev", "draft"],
        ratings: ["pos"],
        stats:
            process.env.SPORT === "basketball"
                ? [
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
                  ]
                : [
                      "keyStats",
                      "av",
                      "pntYds",
                      "fg",
                      "krTD",
                      "krYds",
                      "prTD",
                      "prYds",
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
        p.pos = p.ratings[p.ratings.length - 1].pos;
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
        tied: g.ties ? teams[0].seasonAttrs.tied : undefined,
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
            tied: g.ties && t.seasonAttrs ? t.seasonAttrs.tied : undefined,
        };
    });

    return { bestRecord, bestRecordConfs };
};

const leagueLeaders = (
    players: PlayerFiltered[],
    categories: {
        name: string,
        stat: string,
        minValue: number,
    }[],
    awardsByPlayer: AwardsByPlayer,
) => {
    const factor =
        (g.numGames / defaultGameAttributes.numGames) *
        Math.sqrt(g.quarterLength / defaultGameAttributes.quarterLength); // To handle changes in number of games and playing time
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
    if (
        !allowNone &&
        actualAmount !== Infinity &&
        actualAmount > 1 &&
        players.length < actualAmount
    ) {
        throw new Error("Not enough players");
    }

    // If all players are filtered out above (like MIP initial year), then this will return an empty array
    return players.slice(0, actualAmount);
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

export {
    getPlayers,
    getTopPlayers,
    leagueLeaders,
    saveAwardsByPlayer,
    teamAwards,
};
