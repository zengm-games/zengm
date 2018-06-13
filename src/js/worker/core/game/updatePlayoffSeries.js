// @flow

import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";
import type { Conditions, GameResults } from "../../../common/types";

const updatePlayoffSeries = async (
    results: GameResults,
    conditions: Conditions,
) => {
    const playoffSeries = await idb.cache.playoffSeries.get(g.season);

    const playoffRound = playoffSeries.series[playoffSeries.currentRound];

    for (const result of results) {
        // Did the home (true) or away (false) team win this game? Here, "home" refers to this game, not the team which has homecourt advnatage in the playoffs, which is what series.home refers to below.
        const won0 = result.team[0].stat.pts > result.team[1].stat.pts;

        let series;
        for (let i = 0; i < playoffRound.length; i++) {
            series = playoffRound[i];

            if (series.home.tid === result.team[0].id) {
                if (won0) {
                    series.home.won += 1;
                } else {
                    series.away.won += 1;
                }
                break;
            } else if (series.away.tid === result.team[0].id) {
                if (won0) {
                    series.away.won += 1;
                } else {
                    series.home.won += 1;
                }
                break;
            }
        }

        // For flow, not really necessary
        if (series === undefined) {
            continue;
        }

        // Log result of playoff series
        if (series.away.won >= 4 || series.home.won >= 4) {
            let winnerTid;
            let loserTid;
            let loserWon;
            if (series.away.won >= 4) {
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
                currentRoundText = "first round of the playoffs";
            } else if (playoffSeries.currentRound === 1) {
                currentRoundText = "second round of the playoffs";
            } else if (playoffSeries.currentRound === 2) {
                currentRoundText = "conference finals";
            } else if (playoffSeries.currentRound === 3) {
                currentRoundText = "league championship";
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
                    }</a> in the ${currentRoundText}, 4-${loserWon}.`,
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
