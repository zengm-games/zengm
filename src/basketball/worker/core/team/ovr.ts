import { helpers } from "../../../../deion/worker/util";

const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
) => {
	const ovrs = players.map(p => p.ratings.ovr).sort((a, b) => b - a);

	while (ovrs.length < 10) {
		ovrs.push(0);
	}

	// See analysis/team-ovr-basketball
	const predictedMOV =
		-124.508969997621 +
		0.4218802 * ovrs[0] +
		0.34070417 * ovrs[1] +
		0.3458834 * ovrs[2] +
		0.28931358 * ovrs[3] +
		0.21194375 * ovrs[4] +
		0.14966658 * ovrs[5] +
		0.14314723 * ovrs[6] +
		0.10012792 * ovrs[7] +
		0.10397797 * ovrs[8] +
		0.06609493 * ovrs[9];

	// Translate from -20/20 to 0/100 scale
	const rawOVR = (predictedMOV * 50) / 20 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

export default ovr;
