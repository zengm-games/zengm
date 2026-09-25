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
import { bySport } from "../../../common/sportFunctions.ts";

// Cache for performance
let groupedRatings: Record<string, Ratings> | undefined;

type RealPlayerDeterminismInfo = {
	bornYear: number;
	realPlayerDeterminism: number;
	srID: string;
};

// Async part of developSeason, split out so it can be done only once when calling developSeasonSync many times (like in monteCarloPot)
export const getRealPlayerDeterminismInfo = async (
	srID: string | undefined,
	forPot: boolean,
): Promise<RealPlayerDeterminismInfo | undefined> => {
	if (__SPORT !== "basketball" || !Object.hasOwn(g, "realPlayerDeterminism")) {
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

	return {
		bornYear: bio.bornYear,
		realPlayerDeterminism,
		srID,
	};
};

export const developSeasonSync = (
	ratings: MinimalPlayerRatings,
	age: number,
	coachingLevel: number,
	realPlayerDeterminismInfo: RealPlayerDeterminismInfo | undefined,
) => {
	bySport({
		baseball: developSeasonBaseball(ratings as any, age, coachingLevel),
		basketball: developSeasonBasketball(ratings as any, age, coachingLevel),
		football: developSeasonFootball(ratings as any, age, coachingLevel),
		hockey: developSeasonHockey(ratings as any, age, coachingLevel),
	});

	if (!realPlayerDeterminismInfo || !groupedRatings) {
		return;
	}

	const { bornYear, realPlayerDeterminism, srID } = realPlayerDeterminismInfo;

	// Find real ratings with same age - can't just use season to look it up, because legends and random debut
	const targetSeason = bornYear + age;
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

export const developSeason = async (
	ratings: MinimalPlayerRatings,
	age: number,
	srID: string | undefined,
	coachingLevel: number,
	forPot: boolean,
) => {
	const realPlayerDeterminismInfo = await getRealPlayerDeterminismInfo(
		srID,
		forPot,
	);
	developSeasonSync(ratings, age, coachingLevel, realPlayerDeterminismInfo);
};
