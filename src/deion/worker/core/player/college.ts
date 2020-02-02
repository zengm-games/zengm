import colleges from "../../data/colleges";
import { random } from "../../util";

const names = Object.keys(colleges);
const weights = (key: string) => colleges[key];

const college = (country: string) => {
	// Most non-US/Canada players will not go to college
	if (country !== "USA" && country !== "Canada" && Math.random() < 0.98) {
		return "";
	}

	// Some players skip college
	if (process.env.SPORT === "basketball" && Math.random() < 0.02) {
		return "";
	}

	return random.choice(names, weights);
};

export default college;
