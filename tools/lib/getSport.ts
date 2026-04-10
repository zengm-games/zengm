export const SPORTS = ["basketball", "football", "baseball", "hockey"] as const;
export type Sport = (typeof SPORTS)[number];

export const getSport = () => {
	if (process.env.SPORT === undefined) {
		return "basketball";
	}
	if (SPORTS.includes(process.env.SPORT as any)) {
		return process.env.SPORT as Sport;
	}
	throw new Error(`Invalid SPORT: ${process.env.SPORT}`);
};
