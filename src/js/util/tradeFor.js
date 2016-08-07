const g = require('../globals');
const ui = require('../ui');
const helpers = require('./helpers');
const league = require('../core/league');
const trade = require('../core/trade');

module.exports = async ({pid}) => {
    console.log('trade for', pid);

    let teams = await trade.get();

    // Start new trade for a single player
    if (pid !== undefined) {
console.log('hi', g.userTid);
        teams = [{
            tid: g.userTid,
            pids: [],
            dpids: [],
        }, {
            tid: undefined,
            pids: [pid],
            dpids: [],
        }];
    }

console.log(teams);

    // Start a new trade based on a list of pids and dpids, like from the trading block
    await trade.create(teams);
    ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
    league.updateLastDbChange();
};
