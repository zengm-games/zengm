import developSeasonBasketball from "./developSeason.basketball";
import developSeasonFootball from "./developSeason.football";
import type { MinimalPlayerRatings } from "../../../common/types";

const developSeason = (
	ratings: MinimalPlayerRatings,
	age: number,
	coachingRank?: number,
) => {
	if (process.env.SPORT === "football") {
		return developSeasonFootball(ratings as any, age, coachingRank);
	}

	return developSeasonBasketball(ratings as any, age, coachingRank);
};

export default developSeason;
