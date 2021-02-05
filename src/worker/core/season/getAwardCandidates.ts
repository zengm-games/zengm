import { isSport } from "../../../common";
import getAwardCandidatesBasketball from "./getAwardCandidates.basketball";
import getAwardCandidatesFootball from "./getAwardCandidates.football";
import getAwardCandidatesHockey from "./getAwardCandidates.hockey";

const getAwardCandidates = (season: number) => {
	if (isSport("football")) {
		return getAwardCandidatesFootball(season);
	}

	if (isSport("hockey")) {
		return getAwardCandidatesHockey(season);
	}

	return getAwardCandidatesBasketball(season);
};

export default getAwardCandidates;
