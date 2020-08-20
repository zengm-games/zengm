import limitRating from "./limitRating";

const heightToRating = (heightInInches: number) => {
	let minHgt;
	let maxHgt;

	if (process.env.SPORT === "football") {
		minHgt = 64; // 5'4"
		maxHgt = 82; // 6'10"
	} else {
		// Min/max for hgt rating.  Displayed height ranges from 4'6" to 9'0", though we might never see the true extremes
		minHgt = 66; // 5'6"
		maxHgt = 93; // 7'9"
	}

	return limitRating((100 * (heightInInches - minHgt)) / (maxHgt - minHgt));
};

export default heightToRating;
