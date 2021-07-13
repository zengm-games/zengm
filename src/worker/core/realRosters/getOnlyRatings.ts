import type { Ratings } from "./loadData.basketball";

type OnlyRatings = {
	hgt: number;
	stre: number;
	spd: number;
	jmp: number;
	endu: number;
	ins: number;
	dnk: number;
	ft: number;
	fg: number;
	tp: number;
	diq: number;
	oiq: number;
	drb: number;
	pss: number;
	reb: number;
	season?: number;
};

const getOnlyRatings = (
	ratings: Ratings,
	keepSeason?: boolean,
): OnlyRatings => {
	const newRatings = {
		hgt: ratings.hgt,
		stre: ratings.stre,
		spd: ratings.spd,
		jmp: ratings.jmp,
		endu: ratings.endu,
		ins: ratings.ins,
		dnk: ratings.dnk,
		ft: ratings.ft,
		fg: ratings.fg,
		tp: ratings.tp,
		diq: ratings.diq,
		oiq: ratings.oiq,
		drb: ratings.drb,
		pss: ratings.pss,
		reb: ratings.reb,
	};

	if (keepSeason) {
		return {
			...newRatings,
			season: ratings.season,
		};
	}

	return newRatings;
};

export default getOnlyRatings;
