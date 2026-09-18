import getPlayers from "./getPlayers.ts";
import type { Position } from "../../../common/types.football.ts";
import type { PlayerGameSim, PlayersOnField } from "./types.ts";

// weightsBonus is not added to denominator, it just gives a bonus in situations e.g. with extra receivers or blockers beyond normal
const getCompositeFactor = (
	playersOnField: PlayersOnField,
	{
		positions,
		orderFunc,
		weightsMain,
		weightsBonus,
		valFunc,
	}: {
		positions: Position[];
		orderFunc: (a: PlayerGameSim) => number;
		weightsMain: number[];
		weightsBonus: number[];
		valFunc: (a: PlayerGameSim) => number;
	},
) => {
	const maxNum = weightsMain.length + weightsBonus.length;
	const players = getPlayers(playersOnField, positions);
	players.sort(
		(a, b) => (orderFunc(b) ?? Infinity) - (orderFunc(a) ?? Infinity),
	);
	const numPlayers = Math.min(players.length, maxNum);
	let factor = 0;

	if (numPlayers > 0) {
		let numerator = 0;
		let denominator = 0;

		for (let i = 0; i < numPlayers; i++) {
			const p = players[i]!;
			const main = i < weightsMain.length;
			const weight = main
				? weightsMain[i]
				: weightsBonus[i - weightsMain.length];

			if (typeof weight !== "number") {
				throw new Error("weight should always be number");
			}

			numerator += weight * valFunc(p);

			if (main) {
				denominator += weight;
			}
		}

		factor = numerator / denominator;
	}

	return factor;
};

export default getCompositeFactor;

const BLOCKING_POSITIONS: Position[] = ["OL", "TE", "RB"];
const BLOCKING_WEIGHTS = [5, 4, 3, 3, 3, 1, 0.5];

// Pass and run blocking use the same players, order, and weights.
export const getBlockingFactors = (playersOnField: PlayersOnField) => {
	const players = getPlayers(playersOnField, BLOCKING_POSITIONS);
	if (players.length === 0) {
		return [0, 0] as const;
	}
	players.sort((a, b) => (b.ovrs.OL ?? Infinity) - (a.ovrs.OL ?? Infinity));

	let passBlocking = 0;
	let runBlocking = 0;
	let denominator = 0;
	const numPlayers = Math.min(players.length, BLOCKING_WEIGHTS.length);
	for (let i = 0; i < numPlayers; i++) {
		const p = players[i]!;
		const weight = BLOCKING_WEIGHTS[i]!;
		const ovr = p.ovrs.OL / 100;
		passBlocking += weight * ((ovr + p.compositeRating.passBlocking) / 2);
		runBlocking += weight * ((ovr + p.compositeRating.runBlocking) / 2);
		if (i < 5) {
			denominator += weight;
		}
	}

	return [passBlocking / denominator, runBlocking / denominator] as const;
};
