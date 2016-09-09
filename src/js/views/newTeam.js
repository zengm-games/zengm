const g = require('../globals');
const team = require('../core/team');
const bbgmViewReact = require('../util/bbgmViewReact');
const NewTeam = require('./views/NewTeam');

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
        gameOver: g.gameOver,
        godMode: g.godMode,
        teams,
    };
}

module.exports = bbgmViewReact.init({
    id: "newTeam",
    runBefore: [updateTeamSelect],
    Component: NewTeam,
});
