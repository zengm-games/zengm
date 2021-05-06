import orderBy from "lodash-es/orderBy";
import { helpers } from "../../../worker/util";

// See analysis/team-ovr-football

// onlyPos=true is used for position-specific rankings
// wholeRoster=true is used for computing team value of the whole roster
const ovr = (
	players: {
		value: number;
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
	{
		onlyPos,
		wholeRoster,
	}: {
		onlyPos?: string;
		wholeRoster?: boolean;
	},
) => {
	// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
	const info = {
		QB: {
			values: [] as number[],
			minLength: 1,
			weights: [0.14020132],
		},
		RB: {
			values: [] as number[],
			minLength: 2,
			weights: [0.04154452, 0.00650348],
		},
		TE: {
			values: [] as number[],
			minLength: 2,
			weights: [0.02776459, 0.005],
		},
		WR: {
			values: [] as number[],
			minLength: 5,
			weights: [0.02381475, 0.01436188, 0.01380022, 0.005, 0.005],
		},
		OL: {
			values: [] as number[],
			minLength: 5,
			weights: [0.1362113, 0.10290326, 0.07238786, 0.07662868, 0.08502353],
		},
		CB: {
			values: [] as number[],
			minLength: 3,
			weights: [0.07704007, 0.06184627, 0.03215704],
		},
		S: {
			values: [] as number[],
			minLength: 3,
			weights: [0.04717957, 0.03800769, 0.00527162],
		},
		LB: {
			values: [] as number[],
			minLength: 4,
			weights: [0.05825392, 0.0242329, 0.00794022, 0.005],
		},
		DL: {
			values: [] as number[],
			minLength: 4,
			weights: [0.17763777, 0.12435656, 0.09421874, 0.07085633],
		},
		K: {
			values: [] as number[],
			minLength: 1,
			weights: [0.04497254],
		},
		P: {
			values: [] as number[],
			minLength: 1,
			weights: [0.0408595],
		},
	};

	const playerInfo = orderBy(
		players.map(p => {
			if (wholeRoster) {
				return {
					pos: p.ratings.pos,
					value: p.value,
				};
			}

			return {
				pos: p.ratings.pos,
				value: p.ratings.ovr,
			};
		}),
		"value",
		"desc",
	);

	for (const { pos, value } of playerInfo) {
		const infoPos = (info as any)[pos] as typeof info["P"] | undefined;
		if (infoPos && (onlyPos === undefined || onlyPos === pos)) {
			infoPos.values.push(value);
		}
	}

	const INTERCEPT = -97.2246364425006;
	const DEFAULT_OVR = 30;

	let predictedMOV = INTERCEPT;
	for (const { values, minLength, weights } of Object.values(info)) {
		const numToInclude = wholeRoster
			? Math.max(values.length, minLength)
			: minLength;
		for (let i = 0; i < numToInclude; i++) {
			// Use DEFAULT_OVR if there are fewer than minLength players at this position
			const value = values[i] ?? DEFAULT_OVR;

			let weight = weights[i];

			// Extrapolate weight for bench players
			if (weight === undefined) {
				// Decay slower for positions with many players, because injury substitutions will be more likely
				const base = (1 + minLength) * 0.1;
				const lastWeight = weights[weights.length - 1];
				const exponent = i - minLength + 1;
				weight = lastWeight * base ** exponent;
			}

			predictedMOV += weight * value;
		}
	}

	if (onlyPos || wholeRoster) {
		// In this case, we're ultimately using the value to compute a rank or some other relative score, so we don't care about the scale. And bounding the scale to be positive below makes it always 0.
		return predictedMOV;
	}

	// Translate from -15/15 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 30 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

export default ovr;
