export const SPORTS = ["basketball", "football", "baseball", "hockey"] as const;
export type Sport = (typeof SPORTS)[number];

export const getSport = () => {
	if (SPORTS.includes(process.env.SPORT)) {
		return process.env.SPORT;
	}
	if (process.env.SPORT === undefined) {
		return "basketball";
	}
	throw new Error(`Invalid SPORT: ${process.env.SPORT}`);
};
