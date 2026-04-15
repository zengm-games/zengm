import posRatingsBaseball from "./posRatings.baseball.ts";
import posRatingsFootball from "./posRatings.football.ts";
import posRatingsHockey from "./posRatings.hockey.ts";
import { RATINGS } from "./constants.ts";
import { bySport } from "./sportFunctions.ts";

export const posRatings = (pos: string) => {
	return bySport({
		baseball: posRatingsBaseball(pos),
		basketball: [...RATINGS],
		football: posRatingsFootball(pos),
		hockey: posRatingsHockey(pos),
	});
};
