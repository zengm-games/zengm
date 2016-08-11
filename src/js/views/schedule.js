const g = require('../globals');
const season = require('../core/season');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const Schedule = require('./views/Schedule');

function get(req) {
    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(req.params.abbrev);
    return inputs;
}

async function updateUpcoming(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("newPhase") >= 0 || inputs.abbrev !== state.abbrev) {
        const schedule = await season.getSchedule();
        const games = [];
        for (let i = 0; i < schedule.length; i++) {
            const game = schedule[i];
            if (inputs.tid === game.homeTid || inputs.tid === game.awayTid) {
                const team0 = {
                    tid: game.homeTid,
                    abbrev: g.teamAbbrevsCache[game.homeTid],
                    region: g.teamRegionsCache[game.homeTid],
                    name: g.teamNamesCache[game.homeTid],
                };
                const team1 = {
                    tid: game.awayTid,
                    abbrev: g.teamAbbrevsCache[game.awayTid],
                    region: g.teamRegionsCache[game.awayTid],
                    name: g.teamNamesCache[game.awayTid],
                };

                games.push({gid: game.gid, teams: [team1, team0]});
            }
        }

        return {
            abbrev: inputs.abbrev,
            season: g.season,
            upcoming: games,
        };
    }
}

// Based on views.gameLog.updateGamesList
async function updateCompleted(inputs, updateEvents, state, setState) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.abbrev !== state.abbrev) {
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
    if (updateEvents.indexOf("gameSim") >= 0) {
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

module.exports = bbgmViewReact.init({
    id: "schedule",
    get,
    runBefore: [updateUpcoming],
    runWhenever: [updateCompleted],
    Component: Schedule,
});
