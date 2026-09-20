import { assert, test } from "vitest";
import {
	getCompositeFactor,
	getBlockingFactors,
} from "./getCompositeFactor.ts";
import type { PlayerGameSim } from "./types.ts";

const player = (rating: number, value: number) =>
	({
		ovrs: { WR: rating },
		compositeRating: { catching: value },
	}) as PlayerGameSim;

test("composite weights keep tied players in formation order and exclude extra players", () => {
	const playersOnField = {
		RB: [player(60, 0.3)],
		WR: [player(80, 0.8), player(60, 0.7), player(10, 0.1)],
		TE: [player(60, 0.5)],
		OL: [player(100, 1)],
	};
	const before = structuredClone(playersOnField);
	const value = getCompositeFactor(playersOnField, {
		positions: ["WR", "TE", "RB"],
		orderFunc: (p) => p.ovrs.WR,
		weightsMain: [5, 3],
		weightsBonus: [0.5],
		valFunc: (p) => p.compositeRating.catching,
	});
	assert.strictEqual(value, (5 * 0.8 + 3 * 0.3 + 0.5 * 0.7) / 8);
	assert.deepEqual(playersOnField, before);
});

test("composite uses only available main weights when a formation is short-handed", () => {
	const options = {
		playersOnField: { WR: [player(60, 0.3)] },
		positions: ["WR"] as const,
		orderFunc: (p: PlayerGameSim) => p.ovrs.WR,
		weightsMain: [5, 3, 2],
		weightsBonus: [0.5],
		valFunc: (p: PlayerGameSim) => p.compositeRating.catching,
	};
	assert.strictEqual(
		getCompositeFactor(options.playersOnField, {
			...options,
			positions: ["WR"],
		}),
		0.3,
	);
	assert.strictEqual(
		getCompositeFactor(options.playersOnField, {
			...options,
			positions: ["TE"],
		}),
		0,
	);
});

test("shared blocking factors match separate calculations for ties, short formations, and missing ratings", () => {
	for (const count of [0, 1, 4, 5, 6, 7, 9]) {
		for (const malformed of [false, true]) {
			const players = Array.from({ length: count }, (_, i) => ({
				ovrs: { OL: i % 3 === 0 ? 60 : 50 },
				compositeRating: {
					passBlocking: 0.05 + i * 0.11,
					runBlocking: 0.9 - i * 0.07,
				},
			})) as PlayerGameSim[];
			if (malformed && players[0]) {
				players[0].ovrs.OL = Number.NaN;
				if (players[1]) {
					delete players[1].compositeRating.runBlocking;
				}
			}
			const playersOnField = {
				RB: players.slice(0, 1),
				TE: players.slice(1, 2),
				OL: players.slice(2),
			};
			const before = structuredClone(playersOnField);
			const actual = getBlockingFactors(playersOnField);
			for (const [i, rating] of ["passBlocking", "runBlocking"].entries()) {
				const expected = getCompositeFactor(playersOnField, {
					positions: ["OL", "TE", "RB"],
					orderFunc: (p) => p.ovrs.OL,
					weightsMain: [5, 4, 3, 3, 3],
					weightsBonus: [1, 0.5],
					valFunc: (p) => (p.ovrs.OL / 100 + p.compositeRating[rating]) / 2,
				});
				assert.isTrue(Object.is(actual[i], expected));
			}
			assert.deepEqual(playersOnField, before);
		}
	}
});
