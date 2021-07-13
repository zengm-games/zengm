import { bySport } from "../../../common";
import limitRating from "./limitRating";

const heightToRating = (heightInInches: number) => {
	const minHgt = bySport({
		basketball: 66, // 5'6"
		football: 64, // 5'4"
		hockey: 62, // 5'2"
	});

	const maxHgt = bySport({
		basketball: 93, // 7'9"
		football: 82, // 6'10"
		hockey: 82, // 6'10"
	});

	return limitRating((100 * (heightInInches - minHgt)) / (maxHgt - minHgt));
};

export default heightToRating;
