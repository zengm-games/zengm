import posRatingsBaseball from "./posRatings.baseball.ts";
import posRatingsFootball from "./posRatings.football.ts";
import posRatingsHockey from "./posRatings.hockey.ts";
import { RATINGS } from "./index.ts";
import bySport from "./bySport.ts";

const posRatings = (pos: string) => {
	return bySport({
		baseball: posRatingsBaseball(pos),
		basketball: [...RATINGS],
		football: posRatingsFootball(pos),
		hockey: posRatingsHockey(pos),
	});
};

export default posRatings;
