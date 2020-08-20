import getAwardCandidatesBasketball from "./getAwardCandidates.basketball";
import getAwardCandidatesFootball from "./getAwardCandidates.football";

const getAwardCandidates = (season: number) => {
	if (process.env.SPORT === "football") {
		return getAwardCandidatesFootball(season);
	}

	return getAwardCandidatesBasketball(season);
};

export default getAwardCandidates;
