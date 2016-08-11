const g = require('../globals');
const season = require('../core/season');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const Schedule = require('./views/Schedule');
const team = require('../core/team');

function get(req) {
    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(req.params.abbrev);
    return inputs;
}

async function updateUpcoming(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("newPhase") >= 0 || inputs.abbrev !== state.abbrev) {
        // Get schedule and all teams.
        const [schedule, teamsFiltered] = await Promise.all([
            season.getSchedule(),
            team.filter({
                attrs: ['tid', 'abbrev'],
                seasonAttrs: ['won', 'lost', 'lastTen', 'streak'],
                season: g.season,
            }),
        ]);

        // Create an object with team IDs as its keys.
        const teamInfo = {};
        for (const team of teamsFiltered) {
            teamInfo[team.tid] = team;
        }

        // Loop through each game in the schedule.
        const upcoming = [];
        for (const game of schedule) {
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

                upcoming.push({gid: game.gid, teams: [team1, team0]});
            }
        }

        return {
            abbrev: inputs.abbrev,
            season: g.season,
            teamInfo,
            upcoming,
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
