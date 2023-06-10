import { helpers, g } from "../../util";
import type { Team } from "../../../common/types";
import {
	DEFAULT_JERSEY,
	DEFAULT_PLAY_THROUGH_INJURIES,
	isSport,
} from "../../../common";
import finances from "../finances";

/**
 * Create a new team object.
 *
 * @memberOf core.team
 * @param {Object} tm Team metadata object, likely from core.league.create.
 * @return {Object} Team object to insert in the database.
 */
// If I ever type this, ensure that at least one of budget and popRank is set
const generate = (tm: any): Team => {
	const strategy = Object.hasOwn(tm, "strategy") ? tm.strategy : "rebuilding";

	const budget = tm.budget ?? {
		coaching: finances.defaultBudgetLevel(tm.popRank),
		facilities: finances.defaultBudgetLevel(tm.popRank),
		health: finances.defaultBudgetLevel(tm.popRank),
		scouting: finances.defaultBudgetLevel(tm.popRank),
		ticketPrice: helpers.defaultTicketPrice(tm.popRank),
	};

	const t: Team = {
		tid: tm.tid,
		cid: tm.cid,
		did: tm.did,
		region: tm.region,
		name: tm.name,
		abbrev: tm.abbrev,

		// imgURL is always a string, imgURLSmall is undefined if not present
		imgURL: tm.imgURL ?? "",
		imgURLSmall: tm.imgURLSmall === "" ? undefined : tm.imgURLSmall,

		budget,
		initialBudget: tm.initialBudget ?? {
			coaching: budget.coaching,
			facilities: budget.facilities,
			health: budget.health,
			scouting: budget.scouting,
		},
		strategy,
		depth: tm.depth,
		colors: tm.colors ? tm.colors : ["#000000", "#cccccc", "#ffffff"],
		jersey: tm.jersey ?? DEFAULT_JERSEY,
		pop: tm.pop ?? 0,
		stadiumCapacity: tm.stadiumCapacity ?? g.get("defaultStadiumCapacity"),
		retiredJerseyNumbers: tm.retiredJerseyNumbers ?? [],
		adjustForInflation: tm.adjustForInflation ?? true,
		disabled: tm.disabled ?? false,
		keepRosterSorted: tm.keepRosterSorted ?? true,
		autoTicketPrice: tm.autoTicketPrice ?? true,
		playThroughInjuries:
			tm.playThroughInjuries ?? DEFAULT_PLAY_THROUGH_INJURIES,
	};

	if (tm.firstSeasonAfterExpansion !== undefined) {
		t.firstSeasonAfterExpansion = tm.firstSeasonAfterExpansion;
	}

	if (tm.srID !== undefined) {
		t.srID = tm.srID;
	}

	if (isSport("football") && tm.depth === undefined) {
		t.depth = {
			QB: [],
			RB: [],
			WR: [],
			TE: [],
			OL: [],
			DL: [],
			LB: [],
			CB: [],
			S: [],
			K: [],
			P: [],
			KR: [],
			PR: [],
		};
	} else if (isSport("hockey") && tm.depth === undefined) {
		t.depth = {
			F: [],
			D: [],
			G: [],
		};
	} else if (isSport("baseball") && tm.depth === undefined) {
		t.depth = {
			L: [],
			LP: [],
			D: [],
			DP: [],
			P: [],
		};
	}

	return t;
};

export default generate;
