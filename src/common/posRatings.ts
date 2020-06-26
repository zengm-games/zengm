import posRatingsFootball from "./posRatings.football";
import { RATINGS } from ".";

const posRatings = (pos: string) => {
	if (process.env.SPORT === "football") {
		return posRatingsFootball(pos);
	}

	return [...RATINGS];
};

export default posRatings;
