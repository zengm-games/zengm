const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const team = require('../core/team');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get() {
    if (!g.gameOver && !g.godMode) {
        return {
            errorMessage: `You may only switch to another team after you're fired or when you're in <a href="${helpers.leagueUrl(["god_mode"])}">God Mode</a>.`,
        };
    }
}

async function post(req) {
    document.getElementById("new-team").disabled = true;

    const newUserTid = parseInt(req.params.tid, 10);

    ui.updateStatus("Idle");
    ui.updatePlayMenu(null);

    await league.setGameAttributesComplete({
        gameOver: false,
        userTid: newUserTid,
        userTids: [newUserTid],
        ownerMood: {
            wins: 0,
            playoffs: 0,
            money: 0,
        },
        gracePeriodEnd: g.season + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
    });

    league.updateLastDbChange();
    league.updateMetaNameRegion(g.teamNamesCache[g.userTid], g.teamRegionsCache[g.userTid]);
    ui.realtimeUpdate([], helpers.leagueUrl([]));
}

async function updateTeamSelect() {
    let teams = await team.filter({
        attrs: ["tid", "region", "name"],
        seasonAttrs: ["winp"],
        season: g.season,
    });

    // Remove user's team (no re-hiring immediately after firing)
    teams.splice(g.userTid, 1);

    // If not in god mode, user must have been fired
    if (!g.godMode) {
        // Order by worst record
        teams.sort((a, b) => a.winp - b.winp);

        // Only get option of 5 worst
        teams = teams.slice(0, 5);
    }

    return {
        godMode: g.godMode,
        teams,
    };
}

function uiFirst() {
    ui.title("New Team");
}

module.exports = bbgmView.init({
    id: "newTeam",
    get,
    post,
    runBefore: [updateTeamSelect],
    uiFirst,
});
