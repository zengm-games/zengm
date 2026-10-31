import getPlayers from "./getPlayers.ts";
import type { Position } from "../../../common/types.football.ts";
import type { PlayerGameSim, PlayersOnField } from "./types.ts";

export type CompositeFactorParams = {
	positions: Position[];
	orderFunc: (a: PlayerGameSim) => number;
	weightsMain: number[];
	weightsBonus: number[];
	valFunc: (a: PlayerGameSim) => number;
};

// weightsBonus is not added to denominator, it just gives a bonus in situations e.g. with extra receivers or blockers beyond normal
export const getCompositeFactor = (
	playersOnField: PlayersOnField,
	{
		positions,
		orderFunc,
		weightsMain,
		weightsBonus,
		valFunc,
	}: CompositeFactorParams,
) => {
	const maxNum = weightsMain.length + weightsBonus.length;
	const players = getPlayers(playersOnField, positions);
	players.sort((a, b) => orderFunc(b) - orderFunc(a));
	const numPlayers = Math.min(players.length, maxNum);

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

		return numerator / denominator;
	}

	return 0;
};

// Pass and run blocking use the same players, order, and weights
// Top 5 blockers, plus a bit more from TE/RB if they exist
const BLOCKING_COMMON: Omit<CompositeFactorParams, "valFunc"> = {
	positions: ["OL", "TE", "RB"],
	orderFunc: (p) => p.ovrs.OL,
	weightsMain: [5, 4, 3, 3, 3],
	weightsBonus: [1, 0.5],
};

export const getBlockingFactors = (
	playersOnField: PlayersOnField,
): [number, number] => {
	const { positions, orderFunc, weightsMain, weightsBonus } = BLOCKING_COMMON;

	const maxNum = weightsMain.length + weightsBonus.length;
	const players = getPlayers(playersOnField, positions);
	players.sort((a, b) => orderFunc(b) - orderFunc(a));
	const numPlayers = Math.min(players.length, maxNum);

	if (numPlayers > 0) {
		let numeratorPassBlocking = 0;
		let numeratorRunBlocking = 0;
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

			const ovr = p.ovrs.OL / 100;
			numeratorPassBlocking +=
				weight * ((ovr + p.compositeRating.passBlocking) / 2);
			numeratorRunBlocking +=
				weight * ((ovr + p.compositeRating.runBlocking) / 2);

			if (main) {
				denominator += weight;
			}
		}

		return [
			numeratorPassBlocking / denominator,
			numeratorRunBlocking / denominator,
		];
	}

	return [0, 0];
};
