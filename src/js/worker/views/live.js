// @flow

import {g} from '../../common';
import {season} from '../core';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateGamesList(): void | {[key: string]: any} {
    const games = await season.getSchedule(true);

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
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('g.gamesInProgress')) {
        return {
            gamesInProgress: g.gamesInProgress,
        };
    }
}

export default {
    runBefore: [updateGamesList, updateGamesInProgress],
};
