import orderBy from "lodash-es/orderBy";
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
		-97.2246364425006 +
		0.14020132 * info.QB.ovrs[0] +
		0.04154452 * info.RB.ovrs[0] +
		0.00650348 * info.RB.ovrs[1] +
		0.02776459 * info.TE.ovrs[0] +
		0.005 * info.TE.ovrs[1] +
		0.02381475 * info.WR.ovrs[0] +
		0.01436188 * info.WR.ovrs[1] +
		0.01380022 * info.WR.ovrs[2] +
		0.005 * info.WR.ovrs[3] +
		0.005 * info.WR.ovrs[4] +
		0.1362113 * info.OL.ovrs[0] +
		0.10290326 * info.OL.ovrs[1] +
		0.07238786 * info.OL.ovrs[2] +
		0.07662868 * info.OL.ovrs[3] +
		0.08502353 * info.OL.ovrs[4] +
		0.07704007 * info.CB.ovrs[0] +
		0.06184627 * info.CB.ovrs[1] +
		0.03215704 * info.CB.ovrs[2] +
		0.04717957 * info.S.ovrs[0] +
		0.03800769 * info.S.ovrs[1] +
		0.00527162 * info.S.ovrs[2] +
		0.05825392 * info.LB.ovrs[0] +
		0.0242329 * info.LB.ovrs[1] +
		0.00794022 * info.LB.ovrs[2] +
		0.005 * info.LB.ovrs[3] +
		0.17763777 * info.DL.ovrs[0] +
		0.12435656 * info.DL.ovrs[1] +
		0.09421874 * info.DL.ovrs[2] +
		0.07085633 * info.DL.ovrs[3] +
		0.04497254 * info.K.ovrs[0] +
		0.0408595 * info.P.ovrs[0];

	if (onlyPos) {
		// In this case, we're ultimately using the value to compute a rank, so we don't care about the scale. And bounding the scale to be positive below makes it always 0.
		return predictedMOV;
	}

	// Translate from -15/15 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 30 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

export default ovr;
