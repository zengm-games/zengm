import orderBy from "lodash/orderBy";
import { helpers } from "../../../worker/util";

const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
	onlyPos?: string,
) => {
	const info = {
		QB: {
			ovrs: [] as number[],
			minLength: 1,
		},
		RB: {
			ovrs: [] as number[],
			minLength: 2,
		},
		TE: {
			ovrs: [] as number[],
			minLength: 2,
		},
		WR: {
			ovrs: [] as number[],
			minLength: 5,
		},
		OL: {
			ovrs: [] as number[],
			minLength: 5,
		},
		CB: {
			ovrs: [] as number[],
			minLength: 3,
		},
		S: {
			ovrs: [] as number[],
			minLength: 3,
		},
		LB: {
			ovrs: [] as number[],
			minLength: 4,
		},
		DL: {
			ovrs: [] as number[],
			minLength: 4,
		},
		K: {
			ovrs: [] as number[],
			minLength: 1,
		},
		P: {
			ovrs: [] as number[],
			minLength: 1,
		},
	};

	const ratings = orderBy(
		players.map(p => p.ratings),
		"ovr",
		"desc",
	);

	for (const { ovr, pos } of ratings) {
		const infoPos = (info as any)[pos] as typeof info["P"] | undefined;
		if (infoPos && (onlyPos === undefined || onlyPos === pos)) {
			infoPos.ovrs.push(ovr);
		}
	}

	// Pad to minimum lengths=
	for (const { minLength, ovrs } of Object.values(info)) {
		while (ovrs.length < minLength) {
			ovrs.push(20);
		}
	}

	// See analysis/team-ovr-football
	const predictedMOV =
		-141.16249800360956 +
		0.27475987 * info.QB.ovrs[0] +
		0.01937121 * info.RB.ovrs[0] +
		0.00436415 * info.RB.ovrs[1] +
		0.03105994 * info.TE.ovrs[0] +
		0.00674677 * info.TE.ovrs[1] +
		0.06098162 * info.WR.ovrs[0] +
		0.03331908 * info.WR.ovrs[1] +
		0.02548362 * info.WR.ovrs[2] +
		0.01550788 * info.WR.ovrs[3] +
		0.00100514 * info.WR.ovrs[4] +
		0.19319358 * info.OL.ovrs[0] +
		0.13220752 * info.OL.ovrs[1] +
		0.10476351 * info.OL.ovrs[2] +
		0.10256055 * info.OL.ovrs[3] +
		0.08791494 * info.OL.ovrs[4] +
		0.13368333 * info.CB.ovrs[0] +
		0.08610441 * info.CB.ovrs[1] +
		0.03589333 * info.CB.ovrs[2] +
		0.10272653 * info.S.ovrs[0] +
		0.05600678 * info.S.ovrs[1] +
		0.04070437 * info.S.ovrs[2] +
		0.07226837 * info.LB.ovrs[0] +
		0.00066672 * info.LB.ovrs[1] +
		0.00281938 * info.LB.ovrs[2] +
		0.00002897 * info.LB.ovrs[3] +
		0.23767406 * info.DL.ovrs[0] +
		0.16659192 * info.DL.ovrs[1] +
		0.13864289 * info.DL.ovrs[2] +
		0.09932564 * info.DL.ovrs[3] +
		0.08030877 * info.K.ovrs[0] +
		0.05119918 * info.P.ovrs[0];

	if (onlyPos) {
		// In this case, we're ultimately using the value to compute a rank, so we don't care about the scale. And bounding the scale to be positive below makes it always 0.
		return predictedMOV;
	}

	// Translate from -15/15 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 30 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

export default ovr;
