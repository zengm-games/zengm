const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');

async function updateMultiTeamMode(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
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

function uiFirst(vm) {
    ui.title("Multi Team Mode");

    ko.computed(() => {
        const newUserTids = vm.userTids();

        if (newUserTids.length < 1) {
            return;
        }

        if (JSON.stringify(newUserTids) !== JSON.stringify(g.userTids)) {
            const gameAttributes = {userTids: newUserTids};
            if (newUserTids.indexOf(g.userTid) < 0) {
                gameAttributes.userTid = newUserTids[0];
            }
            league.setGameAttributesComplete(gameAttributes);

            if (newUserTids.length === 1) {
                league.updateMetaNameRegion(g.teamNamesCache[newUserTids[0]], g.teamRegionsCache[newUserTids[0]]);
            } else {
                league.updateMetaNameRegion("Multi Team Mode", "");
            }

            league.updateLastDbChange();
        }
    });
}

module.exports = bbgmView.init({
    id: "multiTeamMode",
    runBefore: [updateMultiTeamMode],
    uiFirst,
});
