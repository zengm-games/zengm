import { bySport } from "../../../common";
import getAwardCandidatesBaseball from "./getAwardCandidates.baseball";
import getAwardCandidatesBasketball from "./getAwardCandidates.basketball";
import getAwardCandidatesFootball from "./getAwardCandidates.football";
import getAwardCandidatesHockey from "./getAwardCandidates.hockey";

const getAwardCandidates = (season: number) => {
	return bySport({
		baseball: getAwardCandidatesBaseball(season),
		basketball: getAwardCandidatesBasketball(season),
		football: getAwardCandidatesFootball(season),
		hockey: getAwardCandidatesHockey(season),
	});
};

export default getAwardCandidates;
