import type { Position } from "../../../common/types.baseball";
import ovrByPosFactory from "./ovrByPosFactory";

// See analysis/team-ovr-baseball

const intercept = -9.269895772377641;

// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
const weights: Record<Position, number[]> = {
	SP: [1, 1, 1, 0.9, 0.8],
	RP: [0.8, 0.8, 0.7, 0.7, 0.6],
	C: [1],
	"1B": [1],
	"2B": [1],
	"3B": [1],
	SS: [1],
	LF: [1],
	CF: [1],
	RF: [1],
	DH: [1],
};

const scale = (predictedMOV: number) => {
	// Translate from -0.9/0.9 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 1.8 + 50;
	return Math.round(rawOVR);
};

const ovr = ovrByPosFactory(weights, intercept, scale);

export default ovr;
