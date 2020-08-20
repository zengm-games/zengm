import genRatingsBasketball from "./genRatings.basketball";
import genRatingsFootball from "./genRatings.football";

const genRatings = (season: number, scoutingRank: number) => {
	if (process.env.SPORT === "football") {
		return genRatingsFootball(season, scoutingRank);
	}

	return genRatingsBasketball(season, scoutingRank);
};

export default genRatings;
