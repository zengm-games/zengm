import type { Position } from "../../../common/types.baseball";
import ovrByPosFactory from "./ovrByPosFactory";

// See analysis/team-ovr-baseball

const intercept = -4.7;

const scale2 = 0.005;

// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
const weights: Record<Position, number[]> = {
	SP: [1 * scale2, 1 * scale2, 1 * scale2, 0.9 * scale2, 0.8 * scale2],
	RP: [0.8 * scale2, 0.8 * scale2, 0.7 * scale2, 0.7 * scale2, 0.6 * scale2],
	C: [1 * scale2],
	"1B": [1 * scale2],
	"2B": [1 * scale2],
	"3B": [1 * scale2],
	SS: [1 * scale2],
	LF: [1 * scale2],
	CF: [1 * scale2],
	RF: [1 * scale2],
	DH: [1 * scale2],
};

const scale = (predictedMOV: number) => {
	// Translate from -0.9/0.9 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 1.8 + 50;
	return Math.round(rawOVR);
};

const ovr = ovrByPosFactory(weights, intercept, scale);

export default ovr;
