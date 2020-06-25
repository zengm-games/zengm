import developSeasonBasketball from "./developSeason.basketball";
import developSeasonFootball from "./developSeason.football";
import type { MinimalPlayerRatings } from "../../../common/types";
import { g, helpers } from "../../util";
import { RATINGS } from "../../../common";
import loadDataBasketball from "../realRosters/loadData.basketball";
import type { Ratings } from "../realRosters/loadData.basketball";
import limitRating from "./limitRating";

// Cache for performance
let groupedRatings: Record<string, Ratings | undefined> | undefined;

const developSeason = async (
	ratings: MinimalPlayerRatings,
	age: number,
	srID: string | undefined,
	coachingRank?: number,
) => {
	if (process.env.SPORT === "football") {
		return developSeasonFootball(ratings as any, age, coachingRank);
	}

	developSeasonBasketball(ratings as any, age, coachingRank);

	const realPlayerDeterminism = helpers.bound(
		g.get("realPlayerDeterminism"),
		0,
		1,
	);
	if (realPlayerDeterminism === 0 || srID === undefined) {
		return;
	}

	if (process.env.SPORT !== "basketball") {
		throw new Error(`Not supported for ${process.env.SPORT}`);
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
