const g = require('../globals');
const ui = require('../ui');
const contractNegotiation = require('../core/contractNegotiation');
const league = require('../core/league');
const trade = require('../core/trade');
const helpers = require('./helpers');

const negotiate = async pid => {
    // If there is no active negotiation with this pid, create it
    const negotiation = await g.dbl.negotiations.get(pid);
    if (!negotiation) {
        const error = await g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", tx => {
            return contractNegotiation.create(tx, pid, false);
        });
        if (error !== undefined && error) {
            helpers.errorNotify(error);
        } else {
            ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
        }
    } else {
        ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
    }
};

const tradeFor = async ({otherDpids, otherPids, pid, tid, userDpids, userPids}) => {
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


module.exports = {
    negotiate,
    tradeFor,
};
