export const SPORTS = ["basketball", "football", "baseball", "hockey"] as const;
export type Sport = (typeof SPORTS)[number];

export const getSport = (): Sport => {
	const sport = process.env.SPORT;
	if (sport === undefined) {
		return "basketball";
	}
	const matchedSport = SPORTS.find((s) => s === sport);
	if (matchedSport !== undefined) {
		return matchedSport;
	}
	throw new Error(`Invalid SPORT: ${sport}`);
};
