import { g } from "../../util";
import type { TeamSeason } from "../../../common/types";

/**
 * Gets the rank of some financial thing over the past 3 seasons, if available.
 *
 * If only 1 or 2 seasons are available, assume 15.5 (average) for the other seasons
 *
 * @memberOf core.finances
 * @param {Object} t Team object
 * @param {string} category Currently either "expenses" or "revenues", but could be extended to allow "budget" if needed.
 * @param {string} item Item inside the category
 * @return {number} Rank, from 1 to g.get("numActiveTeams") (default 30)
 */
const getRankLastThree = <
	Category extends "expenses" | "revenues",
	Item extends keyof TeamSeason[Category],
>(
	teamSeasons: Record<
		Category,
		Record<
			Item,
			{
				rank: number;
			}
		>
	>[],
	category: Category,
	item: Item,
): number => {
	const defaultRank = (g.get("numActiveTeams") + 1) / 2;

	if (g.get("budget")) {
		const s0 = teamSeasons.at(-1);
		const s1 = teamSeasons[teamSeasons.length - 2];
		const s2 = teamSeasons[teamSeasons.length - 3];

		if (s0 && s1 && s2) {
			// Use three seasons if possible
			return (
				// @ts-ignore
				(s0[category][item].rank +
					// @ts-ignore
					s1[category][item].rank +
					// @ts-ignore
					s2[category][item].rank) /
				3
			);
		}

		if (s0 && s1) {
			// Use two seasons if possible
			return (
				// @ts-ignore
				(s0[category][item].rank +
					// @ts-ignore
					s1[category][item].rank +
					defaultRank) /
				3
			);
		}

		if (s0) {
			// @ts-ignore
			return (s0[category][item].rank + 2 * defaultRank) / 3;
		}
	}

	return defaultRank;
};

export default getRankLastThree;
