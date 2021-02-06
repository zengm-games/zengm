import { isSport } from "../../../common";
import getAwardCandidatesBasketball from "./getAwardCandidates.basketball";
import getAwardCandidatesFootball from "./getAwardCandidates.football";

const getAwardCandidates = (season: number) => {
	if (isSport("football")) {
		return getAwardCandidatesFootball(season);
	}

	return getAwardCandidatesBasketball(season);
};

export default getAwardCandidates;
