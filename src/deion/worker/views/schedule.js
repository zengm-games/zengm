// @flow

import { season } from "../core";
import { idb } from "../db";
import { g, getProcessedGames, helpers } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateUpcoming(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("newPhase") ||
        inputs.abbrev !== state.abbrev
    ) {
        // Get schedule and all teams.
        const [schedule, teams] = await Promise.all([
            season.getSchedule(),
            idb.getCopies.teamsPlus({
                attrs: ["abbrev", "name", "region"],
                seasonAttrs: ["won", "lost"],
                season: g.season,
            }),
        ]);

        // Loop through each game in the schedule.
        const upcoming = [];
        for (const game of schedule) {
            if (inputs.tid === game.homeTid || inputs.tid === game.awayTid) {
                upcoming.push({
                    gid: game.gid,
                    teams: [teams[game.awayTid], teams[game.homeTid]],
                });
            }
        }

        return {
            abbrev: inputs.abbrev,
            season: g.season,
            upcoming,
        };
    }
}

// Based on views.gameLog.updateGamesList
async function updateCompleted(
    inputs: { abbrev: string },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (updateEvents.includes("firstRun") || inputs.abbrev !== state.abbrev) {
        /*// Reset list, so old completed games don't temporarily show when switching team
        if (state.completed) {
            setState({completed: undefined});
        }*/

        // Load all games in list
        const games = await getProcessedGames(inputs.abbrev, g.season);

        const completed = games.map(game => helpers.formatCompletedGame(game));

        return { completed };
    }
    if (updateEvents.includes("gameSim")) {
        const completed = Array.isArray(state.completed) ? state.completed : [];
        // Partial update of only new games
        const games = await getProcessedGames(
            inputs.abbrev,
            g.season,
            state.completed,
        );
        for (let i = games.length - 1; i >= 0; i--) {
            completed.unshift(helpers.formatCompletedGame(games[i]));
        }

        return { completed };
    }
}

export default {
    runBefore: [updateUpcoming, updateCompleted],
};
