// @flow

import { season } from "../core";
import { g, helpers, lock } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateGamesList(): void | { [key: string]: any } {
    const games = helpers.deepCopy(await season.getSchedule(true));

    for (const game of games) {
        if (game.awayTid === g.userTid || game.homeTid === g.userTid) {
            game.highlight = true;
        } else {
            game.highlight = false;
        }
        game.awayRegion = g.teamRegionsCache[game.awayTid];
        game.awayName = g.teamNamesCache[game.awayTid];
        game.homeRegion = g.teamRegionsCache[game.homeTid];
        game.homeName = g.teamNamesCache[game.homeTid];
    }

    return {
        games,
    };
}

async function updateGamesInProgress(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (updateEvents.includes("lock.gameSim")) {
        return {
            gamesInProgress: lock.get("gameSim"),
        };
    }
}

export default {
    runBefore: [updateGamesList, updateGamesInProgress],
};
