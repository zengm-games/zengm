import orderBy from "lodash/orderBy";
import { g } from ".";
import { isSport } from "../../common";
import random from "./random";

// This should be called only with whatever group of teams you are sorting. So if you are displying division standings, call this once for each division, passing in all the teams. Because tiebreakers could mean two tied teams swap order depending on the teams in the group.
const orderTeams = async <
	T extends {
		seasonAttrs: {
			winp: number;
			won: number;
			did: number;
		};
		tid: number;
	}
>(
	teams: T[],
	season: number = g.get("season"),
): Promise<T[]> => {
	const defaultFuncs = [
		(t: T) => t.seasonAttrs.winp,
		(t: T) => t.seasonAttrs.won,

		// We want ties to be randomly decided, but consistently so orderByWinp can be called multiple times with a deterministic result
		(t: T) =>
			random.uniformSeed(
				t.tid + season + (t.seasonAttrs.won + t.seasonAttrs.winp),
			),
	];
	const defaultOrders: Array<"asc" | "desc"> = ["desc", "desc", "asc"];
	const sortedTeams = orderBy(teams, defaultFuncs, defaultOrders);

	if (isSport("basketball")) {
		return sortedTeams;
	}

	// For football, sort by division leaders first
	const divisionLeaders = new Map<number, number>();

	for (const t of sortedTeams) {
		if (!divisionLeaders.has(t.seasonAttrs.did)) {
			divisionLeaders.set(t.seasonAttrs.did, t.tid);
		}
	}

	return orderBy(
		sortedTeams,
		[
			t => (divisionLeaders.get(t.seasonAttrs.did) === t.tid ? 1 : 0),
			...defaultFuncs,
		],
		["desc", ...defaultOrders],
	);
};

export default orderTeams;
