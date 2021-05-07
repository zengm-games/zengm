import type { PrimaryPosition } from "../../../common/types.football";
import { helpers } from "../../../worker/util";
import ovrByPosFactory from "./ovrByPosFactory";

// See analysis/team-ovr-football

const intercept = -97.2246364425006;

// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
const weights: Record<PrimaryPosition, number[]> = {
	QB: [0.14020132],
	RB: [0.04154452],
	TE: [0.02776459],
	WR: [0.02381475, 0.01436188, 0.01380022],
	OL: [0.1362113, 0.10290326, 0.07238786, 0.07662868, 0.08502353],
	CB: [0.07704007, 0.06184627],
	S: [0.04717957, 0.03800769],
	LB: [0.05825392, 0.0242329],
	DL: [0.17763777, 0.12435656, 0.09421874, 0.07085633],
	K: [0.04497254],
	P: [0.0408595],
};

const scale = (predictedMOV: number) => {
	// Translate from -15/15 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 30 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

const ovr = ovrByPosFactory(weights, intercept, scale);

export default ovr;
