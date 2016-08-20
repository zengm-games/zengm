const g = require('../globals');
const contractNegotiation = require('../core/contractNegotiation');
const freeAgents = require('../core/freeAgents');
const player = require('../core/player');
const team = require('../core/team');
const bbgmViewReact = require('../util/bbgmViewReact');
const Negotiation = require('./views/Negotiation');

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

    // Generate contract options
    const contractOptions = generateContractOptions(p.contract, p.ratings.ovr);

    const payroll = await team.getPayroll(null, g.userTid).get(0);
    return {
        contractOptions,
        payroll: payroll / 1000,
        player: p,
        resigning: negotiation.resigning,
        salaryCap: g.salaryCap / 1000,
        userTid: g.userTid,
    };
}

module.exports = bbgmViewReact.init({
    id: "negotiation",
    get,
    runBefore: [updateNegotiation],
    Component: Negotiation,
});
