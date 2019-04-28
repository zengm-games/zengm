// @flow

import { finances, player, season, team } from "..";
import { idb } from "../../db";
import { achievement, g, helpers, local, logEvent } from "../../util";
import type { Conditions } from "../../../common/types";

const newPhasePlayoffs = async (
    conditions: Conditions,
    liveGameSim?: boolean = false,
) => {
    achievement.check("afterRegularSeason", conditions);

    // In case this was somehow set already
    local.playingUntilEndOfRound = false;

    // Set playoff matchups
    const teams = helpers.orderByWinp(
        await idb.getCopies.teamsPlus({
            attrs: ["tid", "cid"],
            seasonAttrs: ["winp", "won"],
            season: g.season,
        }),
    );

    // Add entry for wins for each team, delete seasonAttrs just used for sorting
    for (let i = 0; i < teams.length; i++) {
        teams[i].won = 0;
        teams[i].winp = teams[i].seasonAttrs.winp;
        delete teams[i].seasonAttrs;
    }

    const { series, tidPlayoffs } = season.genPlayoffSeries(teams);

    for (const tid of tidPlayoffs) {
        logEvent(
            {
                type: "playoffs",
                text: `The <a href="${helpers.leagueUrl([
                    "roster",
                    g.teamAbbrevsCache[tid],
                    g.season,
                ])}">${
                    g.teamNamesCache[tid]
                }</a> made the <a href="${helpers.leagueUrl([
                    "playoffs",
                    g.season,
                ])}">playoffs</a>.`,
                showNotification: tid === g.userTid,
                tids: [tid],
            },
            conditions,
        );
    }

    await idb.cache.playoffSeries.put({
        season: g.season,
        currentRound: 0,
        series,
    });

    // Add row to team stats and team season attributes
    const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
        "teamSeasonsBySeasonTid",
        [[g.season], [g.season, "Z"]],
    );
    for (const teamSeason of teamSeasons) {
        if (tidPlayoffs.includes(teamSeason.tid)) {
            await idb.cache.teamStats.add(
                team.genStatsRow(teamSeason.tid, true),
            );

            teamSeason.playoffRoundsWon = 0;

            // More hype for making the playoffs
            teamSeason.hype += 0.05;
            if (teamSeason.hype > 1) {
                teamSeason.hype = 1;
            }
        } else {
            // Less hype for missing the playoffs
            teamSeason.hype -= 0.05;
            if (teamSeason.hype < 0) {
                teamSeason.hype = 0;
            }
        }

        await idb.cache.teamSeasons.put(teamSeason);
    }

    // Add row to player stats
    await Promise.all(
        tidPlayoffs.map(async tid => {
            const players = await idb.cache.players.indexGetAll(
                "playersByTid",
                tid,
            );
            for (const p of players) {
                player.addStatsRow(p, true);
                await idb.cache.players.put(p);
            }
        }),
    );

    await Promise.all([
        finances.assessPayrollMinLuxury(),
        season.newSchedulePlayoffsDay(),
    ]);

    // Don't redirect if we're viewing a live game now
    let url;
    if (!liveGameSim) {
        url = helpers.leagueUrl(["playoffs"]);
    }

    return [url, ["teamFinances"]];
};

export default newPhasePlayoffs;
