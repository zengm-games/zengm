// @flow

import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../../deion/common/types";

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
        const resetStats = [
            "min",
            "fg",
            "fga",
            "tp",
            "tpa",
            "ft",
            "fta",
            "orb",
            "drb",
            "ast",
            "tov",
            "stl",
            "blk",
            "ba",
            "pf",
            "pts",
            "pm",
        ];

        boxScore.overtime = "";
        boxScore.quarter = "1st quarter";
        boxScore.time = "12:00";
        boxScore.gameOver = false;
        for (let i = 0; i < boxScore.teams.length; i++) {
            // Team metadata
            boxScore.teams[i].abbrev =
                g.teamAbbrevsCache[boxScore.teams[i].tid];
            boxScore.teams[i].region =
                g.teamRegionsCache[boxScore.teams[i].tid];
            boxScore.teams[i].name = g.teamNamesCache[boxScore.teams[i].tid];

            boxScore.teams[i].ptsQtrs = [0];
            for (let s = 0; s < resetStats.length; s++) {
                boxScore.teams[i][resetStats[s]] = 0;
            }
            for (let j = 0; j < boxScore.teams[i].players.length; j++) {
                // Fix for players who were hurt this game - don't show right away!
                if (
                    boxScore.teams[i].players[j].injury.type !== "Healthy" &&
                    boxScore.teams[i].players[j].min > 0
                ) {
                    boxScore.teams[i].players[j].injury = {
                        type: "Healthy",
                        gamesRemaining: 0,
                    };
                }

                for (let s = 0; s < resetStats.length; s++) {
                    boxScore.teams[i].players[j][resetStats[s]] = 0;
                }

                boxScore.teams[i].players[j].inGame = j < 5;
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
