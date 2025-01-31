const SPORTS = ["baseball", "basketball", "football", "hockey"] as const;

export const getSport = () => {
	if (SPORTS.includes(process.env.SPORT)) {
		return process.env.SPORT;
	}
	if (process.env.SPORT === undefined) {
		return "basketball";
	}
	throw new Error(`Invalid SPORT: ${process.env.SPORT}`);
};
