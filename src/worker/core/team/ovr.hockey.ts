import type { Position } from "../../../common/types.hockey";
import ovrByPosFactory from "./ovrByPosFactory";

// See analysis/team-ovr-hockey

const intercept = -9.269895772377641;

// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
const weights: Record<Position, number[]> = {
	C: [0.01062436, 0.0118963, 0.01141282, 0.00359347],
	W: [
		0.00802799, 0.00832277, 0.00866636, 0.01008319, 0.00829227, 0.00416982,
		0.00298089, 0.00208876,
	],
	D: [0.00724259, 0.0083376, 0.00655347, 0.0074967, 0.0069662, 0.0031725],

	// Manually redistributed/adjusted, because we kind of only want the first goalie to count for predicting MOV
	G: [0.02535527, 0.0062926],
};

const scale = (predictedMOV: number) => {
	// Translate from -0.9/0.9 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 1.8 + 50;
	return Math.round(rawOVR);
};

const ovr = ovrByPosFactory(weights, intercept, scale);

export default ovr;
