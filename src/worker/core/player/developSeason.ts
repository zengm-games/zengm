import developSeasonBaseball from "./developSeason.baseball.ts";
import developSeasonBasketball from "./developSeason.basketball.ts";
import developSeasonFootball from "./developSeason.football.ts";
import developSeasonHockey from "./developSeason.hockey.ts";
import type { MinimalPlayerRatings } from "../../../common/types.ts";
import { g, helpers } from "../../util/index.ts";
import { RATINGS } from "../../../common/constants.ts";
import loadDataBasketball from "../realRosters/loadData.basketball.ts";
import type { Ratings } from "../realRosters/loadData.basketball.ts";
import limitRating from "./limitRating.ts";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import {
	finalizeProgBreakdown,
	type ProgBreakdown,
} from "./developmentBreakdown.ts";

// Cache for performance
let groupedRatings: Record<string, Ratings> | undefined;

const getRatingsTotal = (ratings: MinimalPlayerRatings) => {
	let total = 0;

	for (const key of RATINGS) {
		total += (ratings as any)[key];
	}

	return total;
};

const developSeason = async (
	ratings: MinimalPlayerRatings,
	age: number,
	srID: string | undefined,
	coachingLevel: number,
	forPot: boolean,
) => {
	const ratingsTotalBefore = getRatingsTotal(ratings);
	const progBreakdown = bySport<ProgBreakdown>({
		baseball: developSeasonBaseball(ratings as any, age, coachingLevel),
		basketball: developSeasonBasketball(ratings as any, age, coachingLevel),
		football: developSeasonFootball(ratings as any, age, coachingLevel),
		hockey: developSeasonHockey(ratings as any, age, coachingLevel),
	});

	if (
		isSport("basketball") &&
		Object.hasOwn(g, "realPlayerDeterminism") &&
		(!forPot || g.get("rpdPot")) &&
		srID !== undefined
	) {
		const realPlayerDeterminism =
			helpers.bound(g.get("realPlayerDeterminism"), 0, 1) ** 2;
		if (realPlayerDeterminism > 0) {
			const basketball = await loadDataBasketball();
			const bio = basketball.bios[srID];

			if (bio) {
				if (!groupedRatings) {
					groupedRatings = {};
					for (const row of basketball.ratings) {
						groupedRatings[`${row.slug}_${row.season}`] = row;
					}
				}

				// Find real ratings with same age - can't just use season to look it up, because legends and random debut
				const targetSeason = bio.bornYear + age;
				const realRatings = groupedRatings[`${srID}_${targetSeason}`];

				if (realRatings) {
					for (const key of RATINGS) {
						(ratings as any)[key] = limitRating(
							realPlayerDeterminism * (realRatings as any)[key] +
								(1 - realPlayerDeterminism) * (ratings as any)[key],
						);
					}
				}
			}
		}
	}

	return finalizeProgBreakdown(
		progBreakdown,
		getRatingsTotal(ratings) - ratingsTotalBefore,
		RATINGS.length,
	);
};

export default developSeason;
