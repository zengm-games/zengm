import type { PrimaryPosition } from "../../../common/types.football.ts";
import ovrByPosFactory from "./ovrByPosFactory.ts";

// See analysis/team-ovr-football

const intercept = -86.54640888008547;

// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
const weights: Record<PrimaryPosition, number[]> = {
	QB: [0.13064995],
	RB: [0.05095315],
	TE: [0.02508516],
	WR: [0.03934526, 0.02273937, 0.0225101],
	OL: [0.0960952, 0.08972395, 0.08229491, 0.08625102, 0.06087159],
	CB: [0.05999902, 0.06117803],
	S: [0.04259323, 0.03714586],
	LB: [0.06662287, 0.04751449],
	DL: [0.14884036, 0.10259512, 0.09146753, 0.03329344],
	K: [0.03444709],
	P: [0.01899517],
};

const scale = (predictedMOV: number) => {
	// Translate from -10/10 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 20 + 42;
	return Math.round(rawOVR);
};

const ovr = ovrByPosFactory(weights, intercept, scale);

export default ovr;
