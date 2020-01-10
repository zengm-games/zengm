import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import { helpers } from "../../../../deion/worker/util";

const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
) => {
	const ratings = orderBy(
		players.map(p => p.ratings),
		"ovr",
		"desc",
	);
	const ratingsByPos = groupBy(ratings, "pos"); // Pad to minimum lengths

	const minLengths = {
		QB: 1,
		RB: 2,
		TE: 2,
		WR: 5,
		OL: 5,
		CB: 3,
		S: 3,
		LB: 4,
		DL: 4,
		K: 1,
		P: 1,
	};

	const ovrsByPos: Record<keyof typeof minLengths, number[]> = {};
	for (const pos of Object.keys(minLengths)) {
		if (!ratingsByPos[pos]) {
			ratingsByPos[pos] = [];
		}

		const ovrs = ratingsByPos[pos].map(r => r.ovr);
		const minLength = minLengths[pos];

		while (ovrs.length < minLength) {
			ovrs.push(20);
		}

		ovrsByPos[pos] = ovrs;
	}

	// See analysis/team-ovr-football
	const predictedMOV =
		-141.16249800360956 +
		0.27475987 * ovrsByPos.QB[0] +
		0.01937121 * ovrsByPos.RB[0] +
		0.00436415 * ovrsByPos.RB[1] +
		0.03105994 * ovrsByPos.TE[0] +
		0.00674677 * ovrsByPos.TE[1] +
		0.06098162 * ovrsByPos.WR[0] +
		0.03331908 * ovrsByPos.WR[1] +
		0.02548362 * ovrsByPos.WR[2] +
		0.01550788 * ovrsByPos.WR[3] +
		0.00100514 * ovrsByPos.WR[4] +
		0.19319358 * ovrsByPos.OL[0] +
		0.13220752 * ovrsByPos.OL[1] +
		0.10476351 * ovrsByPos.OL[2] +
		0.10256055 * ovrsByPos.OL[3] +
		0.08791494 * ovrsByPos.OL[4] +
		0.13368333 * ovrsByPos.CB[0] +
		0.08610441 * ovrsByPos.CB[1] +
		0.03589333 * ovrsByPos.CB[2] +
		0.10272653 * ovrsByPos.S[0] +
		0.05600678 * ovrsByPos.S[1] +
		0.04070437 * ovrsByPos.S[2] +
		0.07226837 * ovrsByPos.LB[0] +
		0.00066672 * ovrsByPos.LB[1] +
		0.00281938 * ovrsByPos.LB[2] +
		0.00002897 * ovrsByPos.LB[3] +
		0.23767406 * ovrsByPos.DL[0] +
		0.16659192 * ovrsByPos.DL[1] +
		0.13864289 * ovrsByPos.DL[2] +
		0.09932564 * ovrsByPos.DL[3] +
		0.08030877 * ovrsByPos.K[0] +
		0.05119918 * ovrsByPos.P[0]; // Translate from -15/15 to 0/100 scale

	const rawOVR = (predictedMOV * 100) / 30 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

export default ovr;
