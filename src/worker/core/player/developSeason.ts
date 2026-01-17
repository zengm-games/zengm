import developSeasonBaseball from "./developSeason.baseball.ts";
import developSeasonBasketball from "./developSeason.basketball.ts";
import developSeasonFootball from "./developSeason.football.ts";
import developSeasonHockey from "./developSeason.hockey.ts";
import type { MinimalPlayerRatings } from "../../../common/types.ts";
import { g, helpers } from "../../util/index.ts";
import { bySport, isSport, RATINGS } from "../../../common/index.ts";
import loadDataBasketball from "../realRosters/loadData.basketball.ts";
import type { Ratings } from "../realRosters/loadData.basketball.ts";
import limitRating from "./limitRating.ts";

// Cache for performance
let groupedRatings: Record<string, Ratings> | undefined;

const developSeason = async (
	ratings: MinimalPlayerRatings,
	age: number,
	srID: string | undefined,
	coachingLevel: number,
	forPot: boolean,
) => {
	bySport({
		baseball: developSeasonBaseball(ratings as any, age, coachingLevel),
		basketball: developSeasonBasketball(ratings as any, age, coachingLevel),
		football: developSeasonFootball(ratings as any, age, coachingLevel),
		hockey: developSeasonHockey(ratings as any, age, coachingLevel),
	});

	if (!isSport("basketball") || !Object.hasOwn(g, "realPlayerDeterminism")) {
		return;
	}

	if (forPot && !g.get("rpdPot")) {
		return;
	}

	if (srID === undefined) {
		return;
	}

	const realPlayerDeterminism =
		helpers.bound(g.get("realPlayerDeterminism"), 0, 1) ** 2;
	if (realPlayerDeterminism === 0) {
		return;
	}

	const basketball = await loadDataBasketball();
	const bio = basketball.bios[srID];
	if (!bio) {
		return;
	}

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
};

export default developSeason;
