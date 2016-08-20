const g = require('../globals');
const league = require('../core/league');
const bbgmViewReact = require('../util/bbgmViewReact');
const MultiTeamMode = require('./views/MultiTeamMode');

async function updateMultiTeamMode(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("g.userTids") >= 0) {
        // Make sure it's current
        await league.loadGameAttribute(null, "godMode");

        const teams = [];
        for (let i = 0; i < g.numTeams; i++) {
            teams.push({
                tid: i,
                name: `${g.teamRegionsCache[i]} ${g.teamNamesCache[i]}`,
            });
        }

        return {
            userTids: g.userTids,
            teams,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "multiTeamMode",
    runBefore: [updateMultiTeamMode],
    Component: MultiTeamMode,
});
