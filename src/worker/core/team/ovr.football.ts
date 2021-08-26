import type { PrimaryPosition } from "../../../common/types.football";
import ovrByPosFactory from "./ovrByPosFactory";

// See analysis/team-ovr-football

const intercept = -88.6122439420989;

// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
const weights: Record<PrimaryPosition, number[]> = {
	QB: [0.14477738],
	RB: [0.02352997],
	TE: [0.02434117],
	WR: [0.01847262, 0.0170727, 0.01084306],
	OL: [0.12422164, 0.09414169, 0.06244824, 0.07886718, 0.08150448],
	CB: [0.06431334, 0.06365693],
	S: [0.04009449, 0.03528115],
	LB: [0.05269825, 0.01306937],
	DL: [0.16511873, 0.11970458, 0.089116, 0.07061544],
	K: [0.03984891],
	P: [0.02809455],
};

const scale = (predictedMOV: number) => {
	// Translate from -10/10 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 20 + 50;
	return Math.round(rawOVR);
};

const ovr = ovrByPosFactory(weights, intercept, scale);

export default ovr;
