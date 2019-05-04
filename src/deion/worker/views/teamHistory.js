// @flow

import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateTeamHistory(
    inputs: { abbrev: string, tid: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        inputs.abbrev !== state.abbrev
    ) {
        let bestRecord;
        let worstRecord;
        let mostWon = -Infinity;
        let mostLost = -Infinity;

        const teamSeasons = await idb.getCopies.teamSeasons({
            tid: inputs.tid,
        });
        const history = [];
        let totalWon = 0;
        let totalLost = 0;
        let totalTied = 0;
        let playoffAppearances = 0;
        let championships = 0;
        for (const teamSeason of teamSeasons) {
            history.push({
                season: teamSeason.season,
                won: teamSeason.won,
                lost: teamSeason.lost,
                tied: g.ties ? teamSeason.tied : undefined,
                playoffRoundsWon: teamSeason.playoffRoundsWon,
            });
            totalWon += teamSeason.won;
            totalLost += teamSeason.lost;
            totalTied += teamSeason.tied;
            if (teamSeason.playoffRoundsWon >= 0) {
                playoffAppearances += 1;
            }
            if (
                teamSeason.playoffRoundsWon === g.numGamesPlayoffSeries.length
            ) {
                championships += 1;
            }

            const won = g.ties
                ? teamSeason.won + 0.5 * teamSeason.tied
                : teamSeason.won;
            const lost = g.ties
                ? teamSeason.lost + 0.5 * teamSeason.tied
                : teamSeason.lost;
            if (won > mostWon) {
                bestRecord = history[history.length - 1];
                mostWon = won;
            }
            if (lost > mostLost) {
                worstRecord = history[history.length - 1];
                mostLost = lost;
            }
        }
        history.reverse(); // Show most recent season first

        const stats =
            process.env.SPORT === "basketball"
                ? ["gp", "min", "pts", "trb", "ast", "per", "ewa"]
                : ["gp", "keyStats", "av"];

        let players = await idb.getCopies.players({ statsTid: inputs.tid });
        players = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "name", "injury", "tid", "hof", "watch"],
            ratings: ["pos"],
            stats: ["season", "abbrev", ...stats],
            tid: inputs.tid,
        });

        // Not sure why this is necessary, but sometimes statsTids gets an entry but ratings doesn't
        players = players.filter(p => p.careerStats.gp > 0);

        // If stats were deleted, ratings won't come through, so don't show player
        players = players.filter(
            p => p.ratings.length > 0 && p.stats.length > 0,
        );

        for (const p of players) {
            p.stats.reverse();

            for (let j = 0; j < p.stats.length; j++) {
                if (p.stats[j].abbrev === g.teamAbbrevsCache[inputs.tid]) {
                    p.lastYr = p.stats[j].season.toString();
                    break;
                }
            }

            p.pos = p.ratings[p.ratings.length - 1].pos;

            delete p.ratings;
            delete p.stats;
        }

        return {
            abbrev: inputs.abbrev,
            history,
            players,
            stats,
            team: {
                name: g.teamNamesCache[inputs.tid],
                region: g.teamRegionsCache[inputs.tid],
                tid: inputs.tid,
            },
            totalWon,
            totalLost,
            totalTied,
            playoffAppearances,
            championships,
            bestRecord,
            worstRecord,
            numConfs: g.confs.length,
            numPlayoffRounds: g.numGamesPlayoffSeries.length,
            ties: g.ties,
        };
    }
}

export default {
    runBefore: [updateTeamHistory],
};
