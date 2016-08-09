const g = require('../globals');
const ui = require('../ui');
const helpers = require('./helpers');
const league = require('../core/league');
const trade = require('../core/trade');

module.exports = async ({otherDpids, otherPids, pid, tid, userDpids, userPids}) => {
    console.log('trade for', pid);

    let teams;

    if (pid !== undefined) {
        // Start new trade for a single player, like a Trade For button
        teams = [{
            tid: g.userTid,
            pids: [],
            dpids: [],
        }, {
            tid: undefined,
            pids: [pid],
            dpids: [],
        }];
    } else {
        // Start a new trade with everything specified, from the trading block
        teams = [{
            tid: g.userTid,
            pids: userPids,
            dpids: userDpids,
        }, {
            tid,
            pids: otherPids,
            dpids: otherDpids,
        }];
    }

    // Start a new trade based on a list of pids and dpids, like from the trading block
    await trade.create(teams);
    ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
    league.updateLastDbChange();
};
