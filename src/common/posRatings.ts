import posRatingsFootball from "./posRatings.football";
import { RATINGS } from ".";
import isSport from "./isSport";

const posRatings = (pos: string) => {
	if (isSport("football")) {
		return posRatingsFootball(pos);
	}

	return [...RATINGS];
};

export default posRatings;
