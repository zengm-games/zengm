import orderBy from "lodash-es/orderBy";
import { bySport } from "../../../common";
import { POSITION_COUNTS } from "../../../common/constants";
import {
	NUM_STARTING_PITCHERS,
	POS_NUMBERS_INVERSE,
} from "../../../common/constants.baseball";
import player from "../player";
import { getDepthDefense, getDepthPitchers } from "./genDepth.baseball";

const DEFAULT_OVR = 0;

const ovrByPosFactory =
	(
		weightsByPos: Record<string, number[]>,
		intercept: number,
		scale: (predictedMOV: number) => number,
	) =>
	(
		players: {
			pid?: number;
			value: number;
			ratings:
				| {
						ovr: number;
						ovrs?: Record<string, number>;
						pos: string;
				  }
				| {
						fuzz: number;
						ovr: number;
						ovrs?: Record<string, number>;
						pos: string;
				  }[];
		}[],
		{
			fast,
			onlyPos,
			wholeRoster,
		}: {
			fast?: boolean;
			onlyPos?: string;
			wholeRoster?: boolean;
		},
	) => {
		const playerInfo = orderBy(
			players.map(p => {
				let ratings;
				let fuzz: number | undefined;
				if (Array.isArray(p.ratings)) {
					ratings = p.ratings.at(-1)!;
					fuzz = ratings.fuzz;
				} else {
					ratings = p.ratings;
				}

				let pos;
				if (
					// This is slower than normal, so don't use in a tight loop like in getTeamOvrDiffs
					bySport({
						baseball: !fast,
						basketball: false,
						football: false,
						hockey: false,
					})
				) {
					// Use depth chart starters for position - important in baseball where subs are rare and cross position players are common

					// Since this might be a hypothetical team (like in a trade evaluation), auto sort first, and then use that depth chart to assign starters
					const depthDefense = getDepthDefense(players as any, true);
					const depthPitchers = getDepthPitchers(players as any);

					// First check position players
					const startingPositionPlayers = depthDefense.slice(0, 9);
					const index = startingPositionPlayers.indexOf(p.pid as any);
					const posIndex = index + 2; // 0 is catcher
					if (posIndex >= 2) {
						pos = (POS_NUMBERS_INVERSE as any)[posIndex];
					} else {
						// Second check pitchers
						const index = depthPitchers.indexOf(p.pid as any);
						if (index < NUM_STARTING_PITCHERS) {
							pos = "SP";
						} else if (pos === "SP" || pos === "RP") {
							// Any non-pitcher in a pitcher slot is assumed to be better placed on as a position player
							pos = "RP";
						} else {
							pos = ratings.pos;
						}
					}
				} else {
					pos = ratings.pos;
				}

				if (wholeRoster) {
					return {
						pos,
						value: p.value,
					};
				}

				let value = ratings.ovrs?.[pos] ?? ratings.ovr;
				if (fuzz !== undefined) {
					value = player.fuzzRating(value, fuzz);
				}

				return {
					pos,
					value,
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
					const lastWeight = weights.at(-1)!;
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
