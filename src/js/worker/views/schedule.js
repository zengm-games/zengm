import Promise from 'bluebird';
import g from '../../globals';
import * as season from '../core/season';
import {getCopy} from '../db';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import Schedule from '../../ui/views/Schedule';

function get(ctx) {
    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(ctx.params.abbrev);
    return inputs;
}

async function updateUpcoming(inputs, updateEvents, state) {
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
async function updateCompleted(inputs, updateEvents, state, setState) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || inputs.abbrev !== state.abbrev) {
        // Reset list, so old completed games don't temporarily show when switching team
        if (state.completed) {
            setState({completed: undefined});
        }

        // Load all games in list
        const games = await helpers.gameLogList(inputs.abbrev, g.season, -1);
        for (let i = 0; i < games.length; i++) {
            games[i] = helpers.formatCompletedGame(games[i]);
        }

        return {completed: games};
    }
    if (updateEvents.includes('gameSim')) {
        const completed = state.completed;
        // Partial update of only new games
        const games = await helpers.gameLogList(inputs.abbrev, g.season, -1, state.completed);
        for (let i = games.length - 1; i >= 0; i--) {
            games[i] = helpers.formatCompletedGame(games[i]);
            completed.unshift(games[i]);
        }

        return {completed};
    }
}

export default bbgmViewReact.init({
    id: "schedule",
    get,
    runBefore: [updateUpcoming, updateCompleted],
    Component: Schedule,
});
