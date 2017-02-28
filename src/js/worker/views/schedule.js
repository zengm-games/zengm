import Promise from 'bluebird';
import {g} from '../../common';
import * as season from '../core/season';
import {getCopy} from '../db';
import {getProcessedGames} from '../util';
import * as helpers from '../../util/helpers';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateUpcoming(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('gameSim') || updateEvents.includes('newPhase') || inputs.abbrev !== state.abbrev) {
        // Get schedule and all teams.
        const [schedule, teams] = await Promise.all([
            season.getSchedule(),
            getCopy.teams({
                attrs: ['abbrev', 'name', 'region'],
                seasonAttrs: ['won', 'lost'],
                season: g.season,
            }),
        ]);

        // Loop through each game in the schedule.
        const upcoming = [];
        for (const game of schedule) {
            if (inputs.tid === game.homeTid || inputs.tid === game.awayTid) {
                upcoming.push({
                    gid: game.gid,
                    teams: [
                        teams[game.awayTid],
                        teams[game.homeTid],
                    ],
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
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    setState: (state: any) => void,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || inputs.abbrev !== state.abbrev) {
        // Reset list, so old completed games don't temporarily show when switching team
        if (state.completed) {
            setState({completed: undefined});
        }

        // Load all games in list
        const games = await getProcessedGames(inputs.abbrev, g.season);
        for (let i = 0; i < games.length; i++) {
            games[i] = helpers.formatCompletedGame(games[i]);
        }

        return {completed: games};
    }
    if (updateEvents.includes('gameSim')) {
        const completed = state.completed;
        // Partial update of only new games
        const games = await getProcessedGames(inputs.abbrev, g.season, state.completed);
        for (let i = games.length - 1; i >= 0; i--) {
            games[i] = helpers.formatCompletedGame(games[i]);
            completed.unshift(games[i]);
        }

        return {completed};
    }
}

export default {
    runBefore: [updateUpcoming, updateCompleted],
};
