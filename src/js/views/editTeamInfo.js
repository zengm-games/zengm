const g = require('../globals');
const team = require('../core/team');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const EditTeamInfo = require('./views/EditTeamInfo');

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
        godMode: g.godMode,
        teams,
    };
}

module.exports = bbgmViewReact.init({
    id: "editTeamInfo",
    runBefore: [updateTeamInfo],
    Component: EditTeamInfo,
});
