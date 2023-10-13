import developSeasonBaseball from "./developSeason.baseball";
import developSeasonBasketball from "./developSeason.basketball";
import developSeasonFootball from "./developSeason.football";
import developSeasonHockey from "./developSeason.hockey";
import type { MinimalPlayerRatings } from "../../../common/types";
import { g, helpers } from "../../util";
import { bySport, isSport, RATINGS } from "../../../common";
import loadDataBasketball from "../realRosters/loadData.basketball";
import type { Ratings } from "../realRosters/loadData.basketball";
import limitRating from "./limitRating";
import { idb } from "src/worker/db";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels";

// Cache for performance
let groupedRatings: Record<string, Ratings | undefined> | undefined;

const developSeason = async (
	ratings: MinimalPlayerRatings,
	age: number,
	srID: string | undefined,
	coachingLevel: number = DEFAULT_LEVEL,
	overrideData?: {
		pid: number;
		season: number;
	},
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

	const overridenRatings =
		overrideData !== undefined
			? await idb.getCopy.playerHistoricRatings({
					pid: overrideData.pid,
					season: overrideData.season,
			  })
			: undefined;

	const realPlayerDeterminism =
		helpers.bound(g.get("realPlayerDeterminism"), 0, 1) ** 2;
	if (
		(realPlayerDeterminism === 0 || srID === undefined) &&
		overridenRatings === undefined
	) {
		return;
	}

	if (srID != undefined && overridenRatings === undefined) {
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
		const targetSeason = bio.bornYear + age;
		const realRatings = groupedRatings[`${srID}_${targetSeason}`];
		for (const key of RATINGS) {
			(ratings as any)[key] = limitRating(
				realPlayerDeterminism * (realRatings as any)[key] +
					(1 - realPlayerDeterminism) * (ratings as any)[key],
			);
		}
	} else if (overridenRatings !== undefined) {
		if (overrideData!!.pid == 2816) {
			console.log(overridenRatings);
			console.log("yo mama");
		}
		for (const key of RATINGS) {
			(ratings as any)[key] = limitRating(
				1.0 * overridenRatings.playerRatings[key] +
					(1 - 1.0) * (ratings as any)[key],
			);
		}
	}
};

export default developSeason;
