import { POSITION_COUNTS } from "../../../common/constants.ts";
import {
	NUM_STARTING_PITCHERS,
	POS_NUMBERS_INVERSE,
} from "../../../common/constants.baseball.ts";
import { getDepthDefense, getDepthPitchers } from "./genDepth.baseball.ts";

type Player = {
	pid: number | undefined;
	value: number;
	ratings: {
		ovrs: Record<string, number> | undefined;
		pos: string;
	};
};

// Used only for one synchronous batch of hypothetical additions. Depth charts
// remain fresh for every roster; only value order and coefficients are reused.
const prepareOvr = (
	players: Player[],
	weightsByPos: Record<string, number[]>,
	intercept: number,
) => {
	const valid = (p: Player) =>
		Number.isFinite(p.value) &&
		p.ratings.ovrs !== undefined &&
		Object.hasOwn(weightsByPos, p.ratings.pos) &&
		!Object.hasOwn(Object.prototype, p.ratings.pos) &&
		Number.isNaN(Number(p.ratings.pos));
	if (!players.every(valid)) {
		return;
	}

	const sorted = players.slice().sort((a, b) => b.value - a.value);
	const coefficientsByPos: Record<string, number[]> = {};
	const getWeights = (pos: string, length: number) => {
		const original = weightsByPos[pos]!;
		const minLength = original.length;
		const weights = (coefficientsByPos[pos] ??= []);
		const count = Math.max(length, minLength);
		for (let i = weights.length; i < count; i++) {
			let weight = original[i];
			if (weight === undefined) {
				const base = (3 + minLength) * 0.05;
				const lastWeight = original.at(-1)!;
				let exponent = i - minLength + 1;
				if (i >= POSITION_COUNTS[pos]!) {
					exponent += 2;
				}
				weight = lastWeight * base ** exponent;
			}
			weights.push(weight);
		}
		return weights;
	};

	const evaluate = (candidate?: Player) => {
		const roster = candidate === undefined ? players : [...players, candidate];
		if (roster.length === 0) {
			return intercept;
		}
		const startingPositionPlayers = getDepthDefense(roster as any, true).slice(
			0,
			9,
		);
		const depthPitchers = getDepthPitchers(roster as any);

		let candidateIndex = -1;
		if (candidate !== undefined) {
			candidateIndex = 0;
			// The appended candidate follows all existing equal-valued players.
			while (
				candidateIndex < sorted.length &&
				sorted[candidateIndex]!.value >= candidate.value
			) {
				candidateIndex += 1;
			}
		}

		const valuesByPos: Record<string, number[]> = {};
		let sortedIndex = 0;
		for (let i = 0; i < roster.length; i++) {
			const p = i === candidateIndex ? candidate! : sorted[sortedIndex++]!;
			const positionIndex = startingPositionPlayers.indexOf(p.pid as any);
			const pos =
				positionIndex >= 0
					? POS_NUMBERS_INVERSE[
							(positionIndex + 2) as keyof typeof POS_NUMBERS_INVERSE
						]
					: depthPitchers.indexOf(p.pid as any) < NUM_STARTING_PITCHERS
						? "SP"
						: p.ratings.pos;
			// Retain the original object insertion and per-position value order.
			(valuesByPos[pos] ??= []).push(p.value);
		}

		let predictedMOV = intercept;
		for (const [pos, values] of Object.entries(valuesByPos)) {
			const weights = getWeights(pos, values.length);
			const count = Math.max(values.length, weightsByPos[pos]!.length);
			for (let i = 0; i < count; i++) {
				predictedMOV += weights[i]! * (values[i] ?? 0);
			}
		}
		return predictedMOV;
	};

	return {
		baseline: evaluate(),
		withPlayer: (p: Player) => (valid(p) ? evaluate(p) : undefined),
	};
};

export default prepareOvr;
