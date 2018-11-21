// @flow

import { idb } from "../../db";
import { g, helpers, logEvent } from "../../../../deion/worker/util";
import type { Conditions, GameResults } from "../../../../deion/common/types";

const updatePlayoffSeries = async (
    results: GameResults,
    conditions: Conditions,
) => {
    const playoffSeries = await idb.cache.playoffSeries.get(g.season);

    const playoffRound = playoffSeries.series[playoffSeries.currentRound];

    const numGamesToWinSeries = helpers.numGamesToWinSeries(
        g.numGamesPlayoffSeries[playoffSeries.currentRound],
    );

    for (const result of results) {
        // Did the home (true) or away (false) team win this game? Here, "home" refers to this game, not the team which has homecourt advnatage in the playoffs, which is what series.home refers to below.
        const won0 = result.team[0].stat.pts > result.team[1].stat.pts;

        let series;
        for (let i = 0; i < playoffRound.length; i++) {
            series = playoffRound[i];

            const { away, home } = series;
            if (!away) {
                continue;
            }

            if (home.tid === result.team[0].id) {
                if (won0) {
                    home.won += 1;
                } else {
                    away.won += 1;
                }
                break;
            } else if (away.tid === result.team[0].id) {
                if (won0) {
                    away.won += 1;
                } else {
                    home.won += 1;
                }
                break;
            }
        }

        // For flow, not really necessary
        if (series === undefined) {
            continue;
        }

        // Log result of playoff series
        if (
            series.away.won >= numGamesToWinSeries ||
            series.home.won >= numGamesToWinSeries
        ) {
            let winnerTid;
            let loserTid;
            let loserWon;
            if (series.away.won >= numGamesToWinSeries) {
                winnerTid = series.away.tid;
                loserTid = series.home.tid;
                loserWon = series.home.won;
            } else {
                winnerTid = series.home.tid;
                loserTid = series.away.tid;
                loserWon = series.away.won;
            }

            let currentRoundText = "";
            if (playoffSeries.currentRound === 0) {
                currentRoundText = `${helpers.ordinal(
                    1,
                )} round of the playoffs`;
            } else if (
                playoffSeries.currentRound ===
                g.numGamesPlayoffSeries.length - 3
            ) {
                currentRoundText = "quarterfinals";
            } else if (
                playoffSeries.currentRound ===
                g.numGamesPlayoffSeries.length - 2
            ) {
                currentRoundText = "semifinals";
            } else if (
                playoffSeries.currentRound ===
                g.numGamesPlayoffSeries.length - 1
            ) {
                currentRoundText = "finals";
            } else {
                currentRoundText = `${helpers.ordinal(
                    playoffSeries.currentRound + 1,
                )} round of the playoffs`;
            }

            const showNotification =
                series.away.tid === g.userTid ||
                series.home.tid === g.userTid ||
                playoffSeries.currentRound === 3;
            logEvent(
                {
                    type: "playoffs",
                    text: `The <a href="${helpers.leagueUrl([
                        "roster",
                        g.teamAbbrevsCache[winnerTid],
                        g.season,
                    ])}">${
                        g.teamNamesCache[winnerTid]
                    }</a> defeated the <a href="${helpers.leagueUrl([
                        "roster",
                        g.teamAbbrevsCache[loserTid],
                        g.season,
                    ])}">${
                        g.teamNamesCache[loserTid]
                    }</a> in the ${currentRoundText}, ${numGamesToWinSeries}-${loserWon}.`,
                    showNotification,
                    tids: [winnerTid, loserTid],
                },
                conditions,
            );
        }
    }

    await idb.cache.playoffSeries.put(playoffSeries);
};

export default updatePlayoffSeries;
