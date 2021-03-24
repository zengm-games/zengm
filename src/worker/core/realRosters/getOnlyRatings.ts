import type { Ratings } from "./loadData.basketball";

const getOnlyRatings = (ratings: Ratings) => {
	return {
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
};

export default getOnlyRatings;
