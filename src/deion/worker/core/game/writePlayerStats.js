// @flow

import { PHASE } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import { g, helpers, local, lock, logEvent, random } from "../../util";
import type { Conditions, GameResults } from "../../../common/types";

const writePlayerStats = async (
    results: GameResults[],
    conditions: Conditions,
) => {
    const injuryTexts = [];
    const pidsInjuredOneGameOrLess = new Set<number>();
    let stopPlay = false;
    let stoppedPlay = false;

    for (const result of results) {
        // Find QBs, for qbW, qbL, qbT
        const qbResults = new Map<number, "qbW" | "qbL" | "qbT">();
        for (let i = 0; i < result.team.length; i++) {
            let maxPss = 0;
            let id;
            for (const p of result.team[i].player) {
                if (p.stat.pss > maxPss) {
                    id = p.id;
                    maxPss = p.stat.pss;
                }
            }
            if (id !== undefined) {
                let qbResult;
                const j = i === 0 ? 1 : 0;
                if (result.team[i].stat.pts > result.team[j].stat.pts) {
                    qbResult = "qbW";
                } else if (result.team[i].stat.pts < result.team[j].stat.pts) {
                    qbResult = "qbL";
                } else {
                    qbResult = "qbT";
                }
                qbResults.set(id, qbResult);
            }
        }

        await Promise.all(
            // eslint-disable-next-line
            result.team.map(t =>
                Promise.all(
                    t.player.map(async p => {
                        // Only need to write stats if player got minutes
                        if (p.stat.min === 0) {
                            return;
                        }

                        const promises = [];

                        promises.push(
                            player.checkStatisticalFeat(
                                p.id,
                                t.id,
                                p,
                                result,
                                conditions,
                            ),
                        );

                        const p2 = await idb.cache.players.get(p.id);
                        let ps = p2.stats[p2.stats.length - 1];

                        // This should never happen, but sometimes does (actually it might not, after putting stats back in player object)
                        const playoffs = g.phase === PHASE.PLAYOFFS;
                        if (
                            !ps ||
                            ps.tid !== t.id ||
                            ps.playoffs !== playoffs
                        ) {
                            player.addStatsRow(p2, playoffs);

                            ps = p2.stats[p2.stats.length - 1];
                        }

                        // Since index is not on playoffs, manually check
                        if (ps.playoffs !== (g.phase === PHASE.PLAYOFFS)) {
                            throw new Error(
                                `Missing playoff stats for player ${p.id}`,
                            );
                        }

                        // Update stats
                        for (const key of Object.keys(p.stat)) {
                            if (!ps.hasOwnProperty(key)) {
                                throw new Error(`Missing key "${key}" on ps`);
                            }
                            if (
                                process.env.SPORT === "football" &&
                                key.endsWith("Lng")
                            ) {
                                if (p.stat[key] > ps[key]) {
                                    ps[key] = p.stat[key];
                                }
                            } else {
                                ps[key] += p.stat[key];
                            }
                        }
                        ps.gp += 1; // Already checked for non-zero minutes played above

                        if (qbResults.has(p.id)) {
                            const stat = qbResults.get(p.id);
                            ps[stat] += 1;
                        }

                        const injuredThisGame =
                            p.injured && p.injury.type === "Healthy";

                        const gameOrWeek =
                            process.env.SPORT === "basketball"
                                ? "game"
                                : "week";

                        // Injury crap - assign injury type if player does not already have an injury in the database
                        let biggestRatingsLoss;
                        if (injuredThisGame) {
                            p2.injury = player.injury(t.healthRank);
                            p.injury = helpers.deepCopy(p2.injury); // So it gets written to box score

                            if (p2.injury.gamesRemaining <= 1) {
                                pidsInjuredOneGameOrLess.add(p2.pid);
                            }

                            const injuryText = `${
                                p.pos
                            } <a href="${helpers.leagueUrl([
                                "player",
                                p2.pid,
                            ])}">${p2.firstName} ${p2.lastName}</a> - ${
                                p2.injury.type
                            }, ${p2.injury.gamesRemaining - 1} ${
                                p2.injury.gamesRemaining - 1 === 1
                                    ? gameOrWeek
                                    : `${gameOrWeek}s`
                            }`;
                            if (g.userTid === p2.tid) {
                                if (p2.injury.gamesRemaining > 1) {
                                    injuryTexts.push(injuryText);
                                }

                                stopPlay =
                                    stopPlay ||
                                    (g.stopOnInjury &&
                                        p2.injury.gamesRemaining >
                                            g.stopOnInjuryGames &&
                                        local.autoPlaySeasons === 0);
                            }
                            logEvent(
                                {
                                    type: "injured",
                                    text: `${
                                        p.pos
                                    } <a href="${helpers.leagueUrl([
                                        "player",
                                        p2.pid,
                                    ])}">${p2.firstName} ${
                                        p2.lastName
                                    }</a> was injured! (${
                                        p2.injury.type
                                    }, out for ${p2.injury.gamesRemaining} ${
                                        p2.injury.gamesRemaining === 1
                                            ? gameOrWeek
                                            : `${gameOrWeek}s`
                                    })`,
                                    showNotification: false,
                                    pids: [p2.pid],
                                    tids: [p2.tid],
                                },
                                conditions,
                            );

                            // Some chance of a loss of athleticism from serious injuries
                            // 100 game injury: 67% chance of losing between 0 and 10 of spd, jmp, endu
                            // 50 game injury: 33% chance of losing between 0 and 5 of spd, jmp, endu
                            const gamesRemainingNormalized =
                                process.env.SPORT === "basketball"
                                    ? p2.injury.gamesRemaining
                                    : p2.injury.gamesRemaining * 3;
                            if (
                                gamesRemainingNormalized > 25 &&
                                Math.random() < gamesRemainingNormalized / 150
                            ) {
                                biggestRatingsLoss = Math.round(
                                    gamesRemainingNormalized / 10,
                                );
                                if (biggestRatingsLoss > 10) {
                                    biggestRatingsLoss = 10;
                                }

                                // Small chance of horrible things
                                if (
                                    biggestRatingsLoss === 10 &&
                                    Math.random() < 0.01
                                ) {
                                    biggestRatingsLoss = 30;
                                }

                                const r = p2.ratings.length - 1;
                                p2.ratings[r].spd = helpers.bound(
                                    p2.ratings[r].spd -
                                        random.randInt(0, biggestRatingsLoss),
                                    0,
                                    100,
                                );
                                p2.ratings[r].endu = helpers.bound(
                                    p2.ratings[r].endu -
                                        random.randInt(0, biggestRatingsLoss),
                                    0,
                                    100,
                                );

                                const rating =
                                    process.env.SPORT === "basketball"
                                        ? "jmp"
                                        : "thp";
                                p2.ratings[r][rating] = helpers.bound(
                                    p2.ratings[r][rating] -
                                        random.randInt(0, biggestRatingsLoss),
                                    0,
                                    100,
                                );
                            }

                            if (stopPlay && !stoppedPlay) {
                                lock.set("stopGameSim", true);
                                stoppedPlay = true;
                            }
                        }

                        // Player value depends on ratings and regular season stats, neither of which can change in the playoffs (except for severe injuries)
                        if (g.phase !== PHASE.PLAYOFFS || biggestRatingsLoss) {
                            player.updateValues(p2);
                        }

                        promises.push(idb.cache.players.put(p2));

                        return Promise.all(promises);
                    }),
                ),
            ),
        );
    }

    return { injuryTexts, pidsInjuredOneGameOrLess, stopPlay };
};

export default writePlayerStats;
