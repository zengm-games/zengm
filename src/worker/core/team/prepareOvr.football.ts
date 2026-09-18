import { POSITION_COUNTS } from "../../../common/constants.ts";

type Player = { value: number; ratings: { pos: string } };

type Group = {
	pos: string;
	values: number[];
	weights: number[];
	terms: number[];
};

// This snapshot is used only during one synchronous set of hypothetical roster
// evaluations. Every weighted term is still added in its original order.
const prepareOvr = (
	players: Player[],
	weightsByPos: Record<string, number[]>,
	intercept: number,
) => {
	const valid = (p: Player) =>
		Number.isFinite(p.value) &&
		Object.hasOwn(weightsByPos, p.ratings.pos) &&
		Number.isNaN(Number(p.ratings.pos));
	if (!players.every(valid)) {
		return;
	}

	const getWeights = (pos: string, length: number) => {
		const original = weightsByPos[pos]!;
		const minLength = original.length;
		const weights: number[] = [];
		for (let i = 0; i < Math.max(length, minLength); i++) {
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

	const sorted = players.slice().sort((a, b) => b.value - a.value);
	const groupsByPos = new Map<string, Group>();
	for (const p of sorted) {
		const pos = p.ratings.pos;
		let group = groupsByPos.get(pos);
		if (group === undefined) {
			group = { pos, values: [], weights: [], terms: [] };
			groupsByPos.set(pos, group);
		}
		group.values.push(p.value);
	}
	const groups = [...groupsByPos.values()];
	let baseline = intercept;
	for (const group of groups) {
		// Include the possible extra player's coefficient, but not its term.
		group.weights = getWeights(group.pos, group.values.length + 1);
		const length = Math.max(
			group.values.length,
			weightsByPos[group.pos]!.length,
		);
		for (let i = 0; i < length; i++) {
			const term = group.weights[i]! * (group.values[i] ?? 0);
			group.terms.push(term);
			baseline += term;
		}
	}

	return {
		baseline,
		withPlayer: (p: Player) => {
			if (!valid(p)) {
				return;
			}
			const group = groupsByPos.get(p.ratings.pos);
			const values = group?.values ?? [];
			const weights = group?.weights ?? getWeights(p.ratings.pos, 1);
			let valueIndex = 0;
			// The hypothetical player was appended to the original roster, so it
			// follows existing players on equal values in the stable global sort.
			while (valueIndex < values.length && values[valueIndex]! >= p.value) {
				valueIndex += 1;
			}
			let groupIndex;
			if (group !== undefined && valueIndex > 0) {
				groupIndex = groups.indexOf(group);
			} else {
				groupIndex = 0;
				while (
					groupIndex < groups.length &&
					groups[groupIndex]!.values[0]! >= p.value
				) {
					groupIndex += 1;
				}
			}

			let predictedMOV = intercept;
			for (let i = 0; i <= groups.length; i++) {
				if (i === groupIndex) {
					for (let j = 0; j < weights.length; j++) {
						const value =
							j === valueIndex
								? p.value
								: (values[j < valueIndex ? j : j - 1] ?? 0);
						predictedMOV += weights[j]! * value;
					}
				}
				const otherGroup = groups[i];
				if (otherGroup !== undefined && otherGroup !== group) {
					for (const term of otherGroup.terms) {
						predictedMOV += term;
					}
				}
			}
			return predictedMOV;
		},
	};
};

export default prepareOvr;
