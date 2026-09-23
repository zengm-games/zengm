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
		ovr: number;
		ovrs?: Record<string, number> | undefined;
		pos: string;
	};
};

type PlayerInfo = { pos: string; value: number };
type Group = { pos: string; values: number[]; terms: number[] };

const getPlayerInfo = (
	players: Player[],
	wholeRoster: boolean | undefined,
	orderedPlayers = players,
) => {
	let startingPositionPlayers: number[] | undefined;
	let depthPitchers: number[] | undefined;
	if (__SPORT === "baseball" && players.length > 0) {
		// Hypothetical additions can change every starter, so always build fresh
		// depth charts using the original roster order.
		startingPositionPlayers = getDepthDefense(players as any, true).slice(0, 9);
		depthPitchers = getDepthPitchers(players as any);
	}

	return orderedPlayers.map((p) => {
		let pos = p.ratings.pos;
		if (startingPositionPlayers && depthPitchers) {
			const index = startingPositionPlayers.indexOf(p.pid as any);
			if (index >= 0) {
				pos = (POS_NUMBERS_INVERSE as any)[index + 2];
			} else if (depthPitchers.indexOf(p.pid as any) < NUM_STARTING_PITCHERS) {
				pos = "SP";
			}
		}

		return {
			pos,
			value: wholeRoster ? p.value : (p.ratings.ovrs?.[pos] ?? p.ratings.ovr),
		};
	});
};

const groupValues = (playerInfo: PlayerInfo[], onlyPos?: string) => {
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
	return Object.entries(valuesByPos);
};

const addTerms = (predictedMOV: number, terms: number[]) => {
	for (const term of terms) {
		predictedMOV += term;
	}
	return predictedMOV;
};

const ovrByPosFactory = (
	weightsByPos: Record<string, number[]>,
	intercept: number,
	scale: (predictedMOV: number) => number,
) => {
	const getWeight = (pos: string, i: number) => {
		const weights = weightsByPos[pos]!;
		let weight = weights[i];
		if (weight === undefined) {
			const minLength = weights.length;
			// Decay slower at positions with more injury substitutions.
			const base = (3 + minLength) * 0.05;
			const lastWeight = weights.at(-1)!;
			let exponent = i - minLength + 1;
			if (i >= POSITION_COUNTS[pos]!) {
				exponent += 2;
			}
			weight = lastWeight * base ** exponent;
		}
		return weight;
	};

	const getTerms = (
		pos: string,
		values: number[],
		wholeRoster: boolean | undefined,
		coefficients?: number[],
	) => {
		const minLength = weightsByPos[pos]!.length;
		const count = wholeRoster ? Math.max(values.length, minLength) : minLength;
		const terms = [];
		for (let i = 0; i < count; i++) {
			// Prepared batches reuse coefficients, including extrapolated bench
			// weights. Both evaluators use the same coefficient and padding rules.
			const weight = coefficients
				? (coefficients[i] ??= getWeight(pos, i))
				: getWeight(pos, i);
			terms.push(weight * (values[i] ?? 0));
		}
		return terms;
	};

	const ovr = (
		players: Player[],
		{ onlyPos, wholeRoster }: { onlyPos?: string; wholeRoster?: boolean },
	) => {
		const playerInfo = getPlayerInfo(players, wholeRoster);
		playerInfo.sort((a, b) => b.value - a.value);

		let predictedMOV = intercept;
		for (const [pos, values] of groupValues(playerInfo, onlyPos)) {
			predictedMOV = addTerms(predictedMOV, getTerms(pos, values, wholeRoster));
		}
		return onlyPos || wholeRoster ? predictedMOV : scale(predictedMOV);
	};

	// A preparation belongs to one roster at a point in time. Then you can more efficiently evaluate how adding one player to the team changes ovr, for a set of candidate players (such as draft prospects or free agents). Overall this is just like 2% faster for simming an entire season in FBGM, so not a huge improvement given the complexity, but maybe worth it.
	const prepareWholeRoster = (players: Player[]) => {
		const coefficientsByPos: Record<string, number[]> = {};
		const getWholeRosterTerms = (pos: string, values: number[]) =>
			getTerms(pos, values, true, (coefficientsByPos[pos] ??= []));

		if (__SPORT === "baseball") {
			const sorted = players.slice().sort((a, b) => b.value - a.value);
			const evaluate = (candidate?: Player) => {
				const roster = candidate ? [...players, candidate] : players;
				let orderedPlayers = sorted;
				if (candidate) {
					orderedPlayers = sorted.slice();
					let index = 0;
					// Appended candidates follow existing equal-valued players.
					while (
						index < sorted.length &&
						sorted[index]!.value >= candidate.value
					) {
						index += 1;
					}
					orderedPlayers.splice(index, 0, candidate);
				}
				let predictedMOV = intercept;
				for (const [pos, values] of groupValues(
					getPlayerInfo(roster, true, orderedPlayers),
				)) {
					predictedMOV = addTerms(
						predictedMOV,
						getWholeRosterTerms(pos, values),
					);
				}
				return predictedMOV;
			};

			return {
				baseline: evaluate(),
				withPlayer: (p: Player) => evaluate(p),
			};
		}

		const playerInfo = getPlayerInfo(players, true);
		playerInfo.sort((a, b) => b.value - a.value);
		const groups: Group[] = groupValues(playerInfo).map(([pos, values]) => ({
			pos,
			values,
			terms: getWholeRosterTerms(pos, values),
		}));
		const groupsByPos = new Map(groups.map((group) => [group.pos, group]));
		let baseline = intercept;
		for (const group of groups) {
			baseline = addTerms(baseline, group.terms);
		}

		return {
			baseline,
			withPlayer: (p: Player) => {
				const group = groupsByPos.get(p.ratings.pos);
				const values = group?.values.slice() ?? [];
				let valueIndex = 0;
				while (valueIndex < values.length && values[valueIndex]! >= p.value) {
					valueIndex += 1;
				}
				values.splice(valueIndex, 0, p.value);
				const terms = getWholeRosterTerms(p.ratings.pos, values);

				// A new best player can also move their position group earlier in
				// the sum. Keep every individual addition in the ordinary order.
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
						predictedMOV = addTerms(predictedMOV, terms);
					}
					const otherGroup = groups[i];
					if (otherGroup !== undefined && otherGroup !== group) {
						predictedMOV = addTerms(predictedMOV, otherGroup.terms);
					}
				}
				return predictedMOV;
			},
		};
	};

	return { ovr, prepareWholeRoster };
};

export default ovrByPosFactory;
