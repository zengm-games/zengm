import { choice } from "../../../common/random.ts";
import { g } from "../../util/index.ts";

const getPlayerFakeAge = <
	T extends {
		born: {
			year: number;
			loc: string;
		};
		real?: boolean;
	},
>(
	players: T[],
): T | void => {
	// This list is very arbitrary, but certain countries are deemed more likely to have a player with a fake age
	const highRiskCountries = [
		"Angola",
		"Belarus",
		"Benin",
		"Bulgaria",
		"Cameroon",
		"Cape Verde",
		"Central African Republic",
		"Chad",
		"China",
		"Congo",
		"Egypt",
		"Gabon",
		"Georgia",
		"Ghana",
		"Guinea",
		"Haiti",
		"Iran",
		"Ivory Coast",
		"Kazakhstan",
		"Kenya",
		"Mali",
		"Morocco",
		"Nigeria",
		"Senegal",
		"South Africa",
		"South Sudan",
		"Sudan",
		"Turkey",
		"Ukraine",
	];

	// Only young random players can have a fake age, and players from high risk countries have 40x risk
	const youngPlayers = players
		.filter((p) => g.get("season") - p.born.year <= 22)
		.filter((p) => !p.real);
	if (youngPlayers.length === 0) {
		return;
	}

	return choice(youngPlayers, (p) =>
		highRiskCountries.includes(p.born.loc) ? 40 : 1,
	);
};

export default getPlayerFakeAge;
