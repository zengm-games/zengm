const g = require('../globals');
const ui = require('../ui');
const contractNegotiation = require('../core/contractNegotiation');
const freeAgents = require('../core/freeAgents');
const player = require('../core/player');
const team = require('../core/team');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

// Show the negotiations list if there are more ongoing negotiations
async function redirectNegotiationOrRoster(cancelled) {
    const negotiations = await g.dbl.negotiations.getAll();
    if (negotiations.length > 0) {
        ui.realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
    } else if (cancelled) {
        ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
    } else {
        ui.realtimeUpdate([], helpers.leagueUrl(["roster"]));
    }
}

function generateContractOptions(contract, ovr) {
    let growthFactor = 0.15;

    // Modulate contract amounts based on last digit of ovr (add some deterministic noise)
    growthFactor += (ovr % 10) * 0.01 - 0.05;

    let exp = g.season;
    if (g.phase > g.PHASE.AFTER_TRADE_DEADLINE) {
        exp += 1;
    }

    const contractOptions = [];
    let found = null;
    for (let i = 0; i < 5; i++) {
        contractOptions[i] = {
            exp: exp + i,
            years: 1 + i,
            amount: 0,
            smallestAmount: false,
        };

        if (contractOptions[i].exp === contract.exp) {
            contractOptions[i].amount = contract.amount;
            contractOptions[i].smallestAmount = true;
            found = i;
        }
    }
    if (found === null) {
        contractOptions[0].amount = contract.amount;
        contractOptions[0].smallestAmount = true;
        found = 0;
    }

    // From the desired contract, ask for more money for less or more years
    for (let i = 0; i < 5; i++) {
        const factor = 1 + Math.abs(found - i) * growthFactor;
        contractOptions[i].amount = contractOptions[found].amount * factor;
        contractOptions[i].amount = 0.05 * Math.round(contractOptions[i].amount / 0.05);  // Make it a multiple of 50k
    }

    return contractOptions.filter(contractOption => contractOption.amount * 1000 <= g.maxContract);
}

function get(req) {
    const pid = parseInt(req.params.pid, 10);

    return {
        pid: pid >= 0 ? pid : null, // Null will load whatever the active one is
    };
}

async function post(req) {
    const pid = parseInt(req.params.pid, 10);

    if (req.params.hasOwnProperty("cancel")) {
        await contractNegotiation.cancel(pid);
        redirectNegotiationOrRoster(true);
    } else if (req.params.hasOwnProperty("accept") && req.params.hasOwnProperty("amount") && req.params.hasOwnProperty("exp")) {
        const error = await contractNegotiation.accept(pid, parseInt(req.params.amount * 1000, 10), parseInt(req.params.exp, 10));
        if (error !== undefined && error) {
            helpers.errorNotify(error);
        }
        redirectNegotiationOrRoster(false);
    } else if (req.params.hasOwnProperty("new")) {
        console.log('use actions.negotiate');
    }
}

async function updateNegotiation(inputs) {
    // Call getAll so it works on null key
    const negotiations = await g.dbl.negotiations.getAll(inputs.pid);

    if (negotiations.length === 0) {
        return {
            errorMessage: `No negotiation with player ${inputs.pid} in progress.`,
        };
    }

    const negotiation = negotiations[0];
    negotiation.player.expiration = negotiation.player.years + g.season;
    // Adjust to account for in-season signings
    if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
        negotiation.player.expiration -= 1;
    }

    let p = await g.dbl.players.get(negotiation.pid);
    p = player.filter(p, {
        attrs: ["pid", "name", "age", "contract", "freeAgentMood"],
        ratings: ["ovr", "pot"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    // This can happen if a negotiation is somehow started with a retired player
    if (!p) {
        contractNegotiation.cancel(negotiation.pid);
        return {
            errorMessage: "Invalid negotiation. Please try again.",
        };
    }

    p.contract.amount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);

    // See views.freeAgents for moods as well
    if (p.freeAgentMood[g.userTid] < 0.25) {
        p.mood = '<span class="text-success"><b>Eager to reach an agreement.</b></span>';
    } else if (p.freeAgentMood[g.userTid] < 0.5) {
        p.mood = '<b>Willing to sign for the right price.</b>';
    } else if (p.freeAgentMood[g.userTid] < 0.75) {
        p.mood = '<span class="text-warning"><b>Annoyed at you.</b></span>';
    } else {
        p.mood = '<span class="text-danger"><b>Insulted by your presence.</b></span>';
    }
    delete p.freeAgentMood;

    // Generate contract options
    p.contractOptions = generateContractOptions(p.contract, p.ratings.ovr);

    const payroll = await team.getPayroll(null, g.userTid).get(0);
    return {
        salaryCap: g.salaryCap / 1000,
        payroll: payroll / 1000,
        player: p,
        resigning: negotiation.resigning,
    };
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title(`Contract Negotiation - ${vm.player.name()}`);
    }).extend({throttle: 1});
}

module.exports = bbgmView.init({
    id: "negotiation",
    get,
    post,
    runBefore: [updateNegotiation],
    uiFirst,
});
