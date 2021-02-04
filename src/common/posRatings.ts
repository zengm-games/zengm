import posRatingsFootball from "./posRatings.football";
import posRatingsHockey from "./posRatings.hockey";
import { RATINGS } from ".";
import bySport from "./bySport";

const posRatings = (pos: string) => {
	return bySport({
		basketball: [...RATINGS],
		football: posRatingsFootball(pos),
		hockey: posRatingsHockey(pos),
	});
};

export default posRatings;
