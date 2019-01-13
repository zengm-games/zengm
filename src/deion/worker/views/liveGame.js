// @flow

import { idb } from "../db";
import { g, helpers, overrides } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updatePlayByPlay(
    inputs: { fromAction: boolean, gidPlayByPlay: number, playByPlay: any[] },
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (updateEvents.includes("firstRun") && !inputs.fromAction) {
        return {
            redirectUrl: helpers.leagueUrl(["live"]),
        };
    }

    if (inputs.playByPlay !== undefined && inputs.playByPlay.length > 0) {
        const boxScore: any = helpers.deepCopy(
            await idb.cache.games.get(inputs.gidPlayByPlay),
        );

        // Stats to set to 0
        if (!overrides.core.player.stats) {
            throw new Error("Missing overrides.core.player.stats");
        }
        if (!overrides.core.team.stats) {
            throw new Error("Missing overrides.core.team.stats");
        }
        const resetStatsPlayer = overrides.core.player.stats.raw;
        const resetStatsTeam = overrides.core.team.stats.raw;

        boxScore.overtime = "";
        boxScore.quarter = "1st quarter";
        boxScore.time = `${g.quarterLength}:00`;
        boxScore.gameOver = false;
        for (const t of boxScore.teams) {
            // Team metadata
            t.abbrev = g.teamAbbrevsCache[t.tid];
            t.region = g.teamRegionsCache[t.tid];
            t.name = g.teamNamesCache[t.tid];

            t.ptsQtrs = [0];
            for (const stat of resetStatsTeam) {
                if (t.hasOwnProperty(stat)) {
                    t[stat] = 0;
                }
            }
            for (let j = 0; j < t.players.length; j++) {
                const p = t.players[j];
                // Fix for players who were hurt this game - don't show right away!
                if (p.injury.type !== "Healthy" && p.min > 0) {
                    p.injury = {
                        type: "Healthy",
                        gamesRemaining: 0,
                    };
                }

                for (const stat of resetStatsPlayer) {
                    if (p.hasOwnProperty(stat)) {
                        p[stat] = 0;
                    }
                }

                if (process.env.SPORT === "basketball") {
                    p.inGame = j < 5;
                }
            }
        }

        return {
            initialBoxScore: boxScore,
            events: inputs.playByPlay,
        };
    }
}

export default {
    runBefore: [updatePlayByPlay],
};
