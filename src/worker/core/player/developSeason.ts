import developSeasonBasketball from "./developSeason.basketball";
import developSeasonFootball from "./developSeason.football";
import developSeasonHockey from "./developSeason.hockey";
import type { MinimalPlayerRatings } from "../../../common/types";
import { g, helpers } from "../../util";
import { bySport, isSport, RATINGS } from "../../../common";
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
	bySport({
		basketball: developSeasonBasketball(ratings as any, age, coachingRank),
		football: developSeasonFootball(ratings as any, age, coachingRank),
		hockey: developSeasonHockey(ratings as any, age, coachingRank),
	});

	if (!isSport("basketball")) {
		return;
	}

	const realPlayerDeterminism =
		helpers.bound(g.get("realPlayerDeterminism"), 0, 1) ** 2;
	if (realPlayerDeterminism === 0 || srID === undefined) {
		return;
	}

	if (!isSport("basketball")) {
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
