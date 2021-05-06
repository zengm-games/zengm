import orderBy from "lodash-es/orderBy";
import { POSITION_COUNTS } from "../../../common/constants.football";
import type { PrimaryPosition } from "../../../common/types.football";
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
	const info: Record<
		PrimaryPosition,
		{
			values: number[];
			weights: number[];
		}
	> = {
		QB: {
			values: [],
			weights: [0.14020132],
		},
		RB: {
			values: [],
			weights: [0.04154452],
		},
		TE: {
			values: [],
			weights: [0.02776459],
		},
		WR: {
			values: [],
			weights: [0.02381475, 0.01436188, 0.01380022],
		},
		OL: {
			values: [],
			weights: [0.1362113, 0.10290326, 0.07238786, 0.07662868, 0.08502353],
		},
		CB: {
			values: [],
			weights: [0.07704007, 0.06184627],
		},
		S: {
			values: [],
			weights: [0.04717957, 0.03800769],
		},
		LB: {
			values: [],
			weights: [0.05825392, 0.0242329],
		},
		DL: {
			values: [],
			weights: [0.17763777, 0.12435656, 0.09421874, 0.07085633],
		},
		K: {
			values: [],
			weights: [0.04497254],
		},
		P: {
			values: [],
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
	const DEFAULT_OVR = 0;

	let predictedMOV = INTERCEPT;
	for (const pos of helpers.keys(info)) {
		const { values, weights } = info[pos];

		const minLength = weights.length;

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
				const base = (3 + minLength) * 0.05;
				const lastWeight = weights[weights.length - 1];
				let exponent = i - minLength + 1;

				// Penalty for exceeding normal roster limits
				if (i >= POSITION_COUNTS[pos]) {
					exponent += 2;
				}

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
