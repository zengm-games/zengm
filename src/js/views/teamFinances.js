import g from '../globals';
import team from '../core/team';
import backboard from 'backboard';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import TeamFinances from './views/TeamFinances';

function get(req) {
    const inputs = {};
    inputs.show = req.params.show !== undefined ? req.params.show : "10";
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(req.params.abbrev);
    return inputs;
}

async function updateTeamFinances(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("teamFinances") >= 0 || inputs.tid !== state.tid || inputs.show !== state.show) {
        const vars = {
            abbrev: inputs.abbrev,
            gamesInProgress: g.gamesInProgress,
            numGames: g.numGames,
            tid: inputs.tid,
            show: inputs.show,
            salaryCap: g.salaryCap / 1000,
            minContract: g.minContract,
            minPayroll: g.minPayroll / 1000,
            luxuryPayroll: g.luxuryPayroll / 1000,
            luxuryTax: g.luxuryTax,
        };

        const contracts = await team.getPayroll(null, inputs.tid).get(1);

        let showInt;
        if (inputs.show === "all") {
            showInt = g.season - g.startingSeason + 1;
        } else {
            showInt = parseInt(inputs.show, 10);
        }

        // Convert contract objects into table rows
        const contractTotals = [0, 0, 0, 0, 0];
        let season = g.season;
        if (g.phase >= g.PHASE.DRAFT) {
            // After the draft, don't show old contract year
            season += 1;
        }
        for (let i = 0; i < contracts.length; i++) {
            contracts[i].amounts = [];
            for (let j = season; j <= contracts[i].exp; j++) {
                // Only look at first 5 years (edited rosters might have longer contracts)
                if (j - season >= 5) {
                    break;
                }

                contracts[i].amounts.push(contracts[i].amount / 1000);
                contractTotals[j - season] += contracts[i].amount / 1000;
            }
            delete contracts[i].amount;
            delete contracts[i].exp;
        }

        vars.contracts = contracts;
        vars.contractTotals = contractTotals;
        vars.salariesSeasons = [season, season + 1, season + 2, season + 3, season + 4];

        const teamSeasons = await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([inputs.tid], [inputs.tid, '']));

        teamSeasons.reverse(); // Most recent season first

        // Add in luxuryTaxShare if it's missing
        for (let i = 0; i < teamSeasons.length; i++) {
            if (!teamSeasons[i].revenues.hasOwnProperty("luxuryTaxShare")) {
                teamSeasons[i].revenues.luxuryTaxShare = {
                    amount: 0,
                    rank: 15,
                };
            }
        }

        let keys = ["won", "hype", "pop", "att", "cash", "revenues", "expenses"];
        const barData = {};
        for (let i = 0; i < keys.length; i++) {
            /* eslint-disable no-loop-func */
            if (typeof teamSeasons[0][keys[i]] !== "object") {
                barData[keys[i]] = helpers.nullPad(teamSeasons.map(ts => ts[keys[i]]), showInt);
            } else {
                // Handle an object in the database
                barData[keys[i]] = {};
                const tempData = teamSeasons.map(ts => ts[keys[i]]);
                Object.keys(tempData[0]).forEach(key => {
                    barData[keys[i]][key] = helpers.nullPad(tempData.map(x => x[key]).map(x => x.amount), showInt);
                });
            }
            /* eslint-enable no-loop-func */
        }

        // Process some values
        barData.att = barData.att.map((num, i) => {
            if (teamSeasons[i] !== undefined) {
                if (!teamSeasons[i].hasOwnProperty("gpHome")) { teamSeasons[i].gpHome = Math.round(teamSeasons[i].gp / 2); } // See also game.js and team.js
                if (teamSeasons[i].gpHome > 0) {
                    return num / teamSeasons[i].gpHome; // per game
                }
                return 0;
            }
        });
        keys = ["cash"];
        for (let i = 0; i < keys.length; i++) {
            barData[keys[i]] = barData[keys[i]].map(num => num / 1000); // convert to millions
        }

        const barSeasons = [];
        for (let i = 0; i < showInt; i++) {
            barSeasons[i] = g.season - i;
        }

        vars.barData = barData;
        vars.barSeasons = barSeasons;
        // Get stuff for the finances form
        const t = await team.filter({
            attrs: ["region", "name", "abbrev", "budget"],
            seasonAttrs: ["expenses", "payroll"],
            season: g.season,
            tid: inputs.tid,
        });

        vars.team = t;
        vars.payroll = t.payroll; // For above/below observables

        return vars;
    }
}

function updateGamesInProgress(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("g.gamesInProgress") >= 0 || inputs.tid !== state.tid || inputs.show !== state.show) {
        return {
            gamesInProgress: g.gamesInProgress,
        };
    }
}

export default bbgmViewReact.init({
    id: "teamFinances",
    get,
    runBefore: [updateTeamFinances, updateGamesInProgress],
    Component: TeamFinances,
});
