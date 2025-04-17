import { bySport } from "../../../common/index.ts";
import getAwardCandidatesBaseball from "./getAwardCandidates.baseball.ts";
import getAwardCandidatesBasketball from "./getAwardCandidates.basketball.ts";
import getAwardCandidatesFootball from "./getAwardCandidates.football.ts";
import getAwardCandidatesHockey from "./getAwardCandidates.hockey.ts";

const getAwardCandidates = (season: number) => {
	return bySport({
		baseball: getAwardCandidatesBaseball(season),
		basketball: getAwardCandidatesBasketball(season),
		football: getAwardCandidatesFootball(season),
		hockey: getAwardCandidatesHockey(season),
	});
};

export default getAwardCandidates;
