// @flow

import { idb } from "../../db";
import { g, helpers } from "../../util";

type BudgetTypes = "budget" | "expenses" | "revenues";

/**
 * Update the rankings of team budgets, expenses, and revenue sources.
 *
 * Budget ranks should be updated after *any* team updates *any* budget item.
 *
 * Revenue and expenses ranks should be updated any time any revenue or expense occurs - so basically, after every game.
 *
 * @memberOf core.finances
 * @param {Array.<string>} type The types of ranks to update - some combination of "budget", "expenses", and "revenues"
 * @param {Promise}
 */
const updateRanks = async (types: BudgetTypes[]) => {
    const sortFn = (a, b) => b.amount - a.amount;

    const getByItem = byTeam => {
        const byItem = {};
        for (const item of Object.keys(byTeam[0])) {
            byItem[item] = byTeam.map((x: any) => x[item]);
            byItem[item].sort(sortFn);
        }
        return byItem;
    };

    const updateObj = (obj, byItem) => {
        // Nonsense for flow
        if (byItem === undefined) {
            return;
        }

        for (const item of helpers.keys(obj)) {
            for (let i = 0; i < byItem[item].length; i++) {
                if (byItem[item][i].amount === obj[item].amount) {
                    obj[item].rank = i + 1;
                    break;
                }
            }
        }
    };

    let teamSeasonsPromise;
    if (types.includes("expenses") || types.includes("revenues")) {
        teamSeasonsPromise = idb.cache.teamSeasons.indexGetAll(
            "teamSeasonsBySeasonTid",
            [[g.season], [g.season, "Z"]],
        );
    } else {
        teamSeasonsPromise = Promise.resolve();
    }

    const [teams, teamSeasons] = await Promise.all([
        idb.cache.teams.getAll(),
        teamSeasonsPromise,
    ]);

    let budgetsByItem;
    let budgetsByTeam;
    if (types.includes("budget")) {
        budgetsByTeam = teams.map(t => t.budget);
        budgetsByItem = getByItem(budgetsByTeam);
    }
    let expensesByItem;
    let expensesByTeam;
    if (types.includes("expenses") && teamSeasons !== undefined) {
        expensesByTeam = teamSeasons.map(ts => ts.expenses);
        expensesByItem = getByItem(expensesByTeam);
    }
    let revenuesByItem;
    let revenuesByTeam;
    if (types.includes("revenues") && teamSeasons !== undefined) {
        revenuesByTeam = teamSeasons.map(ts => ts.revenues);
        revenuesByItem = getByItem(revenuesByTeam);
    }

    for (const t of teams) {
        if (types.includes("budget")) {
            updateObj(t.budget, budgetsByItem);
            await idb.cache.teams.put(t);
        }
        if (types.includes("revenues") && teamSeasons !== undefined) {
            updateObj(teamSeasons[t.tid].expenses, expensesByItem);
        }
        if (types.includes("expenses") && teamSeasons !== undefined) {
            updateObj(teamSeasons[t.tid].revenues, revenuesByItem);
        }
    }

    if (teamSeasons !== undefined) {
        for (const teamSeason of teamSeasons) {
            await idb.cache.teamSeasons.put(teamSeason);
        }
    }
};

export default updateRanks;
