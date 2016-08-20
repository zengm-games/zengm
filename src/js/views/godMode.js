const g = require('../globals');
const league = require('../core/league');
const bbgmViewReact = require('../util/bbgmViewReact');
const GodMode = require('./views/GodMode');

async function updateGodMode(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("toggleGodMode") >= 0) {
        // Make sure it's current
        await league.loadGameAttributes(null);

        return {
            godMode: g.godMode,
            disableInjuries: g.disableInjuries,
            numGames: g.numGames,
            quarterLength: g.quarterLength,
            minRosterSize: g.minRosterSize,
            salaryCap: g.salaryCap / 1000,
            minPayroll: g.minPayroll / 1000,
            luxuryPayroll: g.luxuryPayroll / 1000,
            luxuryTax: g.luxuryTax,
            minContract: g.minContract / 1000,
            maxContract: g.maxContract / 1000,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "godMode",
    runBefore: [updateGodMode],
    Component: GodMode,
});
