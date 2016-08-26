const g = require('../globals');
const team = require('../core/team');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const EditTeamInfo = require('./views/EditTeamInfo');

function get() {
    if (!g.godMode) {
        return {
            errorMessage: `You can't edit teams unless you enable <a href="${helpers.leagueUrl(["god_mode"])}">God Mode</a>.`,
        };
    }
}

async function updateTeamInfo() {
    const teams = await team.filter({
        attrs: ["tid", "abbrev", "region", "name", "imgURL"],
        seasonAttrs: ["pop"],
        season: g.season,
    });

    for (let i = 0; i < teams.length; i++) {
        teams[i].pop = helpers.round(teams[i].pop, 6);
    }

    return {
        teams,
    };
}

module.exports = bbgmViewReact.init({
    id: "editTeamInfo",
    get,
    runBefore: [updateTeamInfo],
    Component: EditTeamInfo,
});
