import { helpers, overrides } from "../../util";

/**
 * Create a new team object.
 *
 * @memberOf core.team
 * @param {Object} tm Team metadata object, likely from core.league.create.
 * @return {Object} Team object to insert in the database.
 */
const generate = (tm: any) => {
	const strategy = tm.hasOwnProperty("strategy") ? tm.strategy : "rebuilding";

	const t = {
		tid: tm.tid,
		cid: tm.cid,
		did: tm.did,
		region: tm.region,
		name: tm.name,
		abbrev: tm.abbrev,
		imgURL: tm.imgURL !== undefined ? tm.imgURL : "",
		budget: {
			ticketPrice: {
				amount: tm.hasOwnProperty("budget")
					? tm.budget.ticketPrice.amount
					: helpers.defaultTicketPrice(tm.popRank),
				rank: tm.hasOwnProperty("budget")
					? tm.budget.ticketPrice.rank
					: tm.popRank,
			},
			scouting: {
				amount: tm.hasOwnProperty("budget")
					? tm.budget.scouting.amount
					: helpers.defaultBudgetAmount(tm.popRank),
				rank: tm.hasOwnProperty("budget")
					? tm.budget.scouting.rank
					: tm.popRank,
			},
			coaching: {
				amount: tm.hasOwnProperty("budget")
					? tm.budget.coaching.amount
					: helpers.defaultBudgetAmount(tm.popRank),
				rank: tm.hasOwnProperty("budget")
					? tm.budget.coaching.rank
					: tm.popRank,
			},
			health: {
				amount: tm.hasOwnProperty("budget")
					? tm.budget.health.amount
					: helpers.defaultBudgetAmount(tm.popRank),
				rank: tm.hasOwnProperty("budget") ? tm.budget.health.rank : tm.popRank,
			},
			facilities: {
				amount: tm.hasOwnProperty("budget")
					? tm.budget.facilities.amount
					: helpers.defaultBudgetAmount(tm.popRank),
				rank: tm.hasOwnProperty("budget")
					? tm.budget.facilities.rank
					: tm.popRank,
			},
		},
		strategy,
		depth: tm.depth,
		colors: tm.colors ? tm.colors : ["#000000", "#cccccc", "#ffffff"],
	};

	if (process.env.SPORT === "football" && tm.depth === undefined) {
		t.depth = overrides.common.constants.POSITIONS.reduce((depth, pos) => {
			depth[pos] = [];
			return depth;
		}, {});
	}

	return t;
};

export default generate;
