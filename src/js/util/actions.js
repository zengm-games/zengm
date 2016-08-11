const g = require('../globals');
const ui = require('../ui');
const contractNegotiation = require('../core/contractNegotiation');
const helpers = require('./helpers');

const negotiate = async pid => {
    console.log('Start negotiation with ', pid);

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

module.exports = {
    negotiate,
};
