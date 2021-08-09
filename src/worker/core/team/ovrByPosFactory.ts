import orderBy from "lodash-es/orderBy";
import { POSITION_COUNTS } from "../../../common/constants";

const DEFAULT_OVR = 0;

const ovrByPosFactory =
	(
		weightsByPos: Record<string, number[]>,
		intercept: number,
		scale: (predictedMOV: number) => number,
	) =>
	(
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

		const valuesByPos: Record<string, number[]> = {};

		for (const { pos, value } of playerInfo) {
			if (onlyPos !== undefined && onlyPos !== pos) {
				continue;
			}

			if (!valuesByPos[pos]) {
				valuesByPos[pos] = [];
			}

			valuesByPos[pos].push(value);
		}

		let predictedMOV = intercept;
		for (const [pos, values] of Object.entries(valuesByPos)) {
			const weights = weightsByPos[pos];
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
					const lastWeight = weights.at(-1);
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

		return scale(predictedMOV);
	};

export default ovrByPosFactory;
