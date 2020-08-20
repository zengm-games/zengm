import { idb } from "../../db";
import { g } from "../../util";
import type { BudgetItem } from "../../../common/types";
import { helpers } from "../../../common";

type BudgetTypes = "budget" | "expenses" | "revenues";

const sortFn = (a: { amount: number }, b: { amount: number }) =>
	b.amount - a.amount;

const getByItem = <T extends string>(byTeam: Record<T, BudgetItem>[]) => {
	const byItem = {} as Record<T, BudgetItem[]>;

	for (const item of helpers.keys(byTeam[0])) {
		byItem[item] = byTeam.map(x => x[item]);
		byItem[item].sort(sortFn);
	}

	return byItem;
};

const updateObj = <T extends string>(
	obj: Record<T, BudgetItem>,
	byItem: Record<T, BudgetItem[]>,
) => {
	for (const item of helpers.keys(obj)) {
		for (let i = 0; i < byItem[item].length; i++) {
			if (byItem[item][i].amount === obj[item].amount) {
				obj[item].rank = i + 1;
				break;
			}
		}
	}
};

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
	const teamSeasons =
		types.includes("expenses") || types.includes("revenues")
			? await idb.cache.teamSeasons.indexGetAll("teamSeasonsBySeasonTid", [
					[g.get("season")],
					[g.get("season"), "Z"],
			  ])
			: undefined;

	const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);

	let budgetsByItem;
	if (types.includes("budget")) {
		const byTeam = teams.map(t => t.budget);
		budgetsByItem = getByItem(byTeam);
	}

	let expensesByItem;
	if (types.includes("expenses") && teamSeasons) {
		const byTeam = teamSeasons.map(ts => ts.expenses);
		expensesByItem = getByItem(byTeam);
	}

	let revenuesByItem;
	if (types.includes("revenues") && teamSeasons) {
		const byTeam = teamSeasons.map(ts => ts.revenues);
		revenuesByItem = getByItem(byTeam);
	}

	for (const t of teams) {
		if (budgetsByItem) {
			updateObj(t.budget, budgetsByItem);
			await idb.cache.teams.put(t);
		}
	}

	if (teamSeasons) {
		for (const ts of teamSeasons) {
			if (expensesByItem) {
				updateObj(ts.expenses, expensesByItem);
			}

			if (revenuesByItem) {
				updateObj(ts.revenues, revenuesByItem);
			}

			await idb.cache.teamSeasons.put(ts);
		}
	}
};

export default updateRanks;
