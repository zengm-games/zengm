import { assert, beforeEach, test } from "vitest";
import { POSITIONS } from "../../../common/constants.baseball.ts";
import { resetG } from "../../../test/helpers.ts";
import { g } from "../../util/index.ts";
import ovr, { prepareWholeRoster } from "./ovr.baseball.ts";
import prepareOvr from "./prepareOvr.baseball.ts";
import ovrByPosFactory from "./ovrByPosFactory.ts";

type Player = Parameters<typeof ovr>[0][number];

const values = [0, -0, 45, 45, 99, 1e17, -1e17, Number.MIN_VALUE, 0.001];

const makePlayer = (index: number, value: number): Player => ({
	pid: index,
	value,
	ratings: {
		ovr: 50,
		pos: POSITIONS[index % POSITIONS.length]!,
		ovrs: Object.fromEntries(
			POSITIONS.map((pos, j) => [pos, (index * 17 + j * 31) % 101]),
		),
	},
});

beforeEach(resetG);

test("prepared baseball additions retain depth, stable ties and exact position sum order", () => {
	let comparisons = 0;
	for (const season of [2026, 2027, 2026, Number.NaN]) {
		g.setWithoutSavingToDB("season", season);
		for (const count of [0, 1, 3, 8, 9, 10, 11, 20, 40, 80]) {
			for (const mode of [
				"normal",
				"tied",
				"duplicatePids",
				"missingPids",
				"oddRatings",
			]) {
				const players = Array.from({ length: count }, (_, i) => {
					const p = makePlayer(
						i,
						mode === "tied" ? 50 : values[(i + count) % values.length]!,
					);
					if (mode === "duplicatePids") {
						p.pid = i % 5;
					} else if (mode === "missingPids") {
						p.pid = i % 2 === 0 ? undefined : Number.NaN;
					} else if (mode === "oddRatings") {
						for (let j = 0; j < POSITIONS.length; j++) {
							if ((i + j) % 5 === 0) {
								p.ratings.ovrs[POSITIONS[j]!] = [
									Number.NaN,
									Infinity,
									-Infinity,
									undefined,
								][(i + j) % 4] as number;
							}
						}
					}
					return p;
				});
				const before = structuredClone(players);
				const prepared = prepareWholeRoster(players)!;
				assert(
					Object.is(prepared.baseline, ovr(players, { wholeRoster: true })),
				);
				comparisons += 1;
				for (let i = 0; i < values.length; i++) {
					const candidate = makePlayer(
						i + 3,
						mode === "tied" ? 50 : values[i]!,
					);
					if (mode === "missingPids") {
						candidate.pid = i % 2 === 0 ? undefined : Number.NaN;
					}
					const expected = ovr([...players, candidate], { wholeRoster: true });
					assert(
						Object.is(prepared.withPlayer(candidate), expected),
						`${season}/${count}/${mode}/${i}`,
					);
					comparisons += 1;
				}
				assert.deepEqual(players, before);
			}
		}
	}
	assert.strictEqual(comparisons, 2000);
});

test("coefficient reuse retains cancellation, sparse weights, and changing group lengths", () => {
	const players = Array.from({ length: 25 }, (_, i) =>
		makePlayer(i, values[i % values.length]!),
	);
	const cases = [
		Object.fromEntries(
			POSITIONS.map((pos, i) => [pos, [i % 2 === 0 ? 1 : -1]]),
		),
		Object.fromEntries(
			POSITIONS.map((pos, i) => [pos, i % 3 === 0 ? [] : [0, undefined, 0.03]]),
		),
		Object.fromEntries(
			POSITIONS.map((pos, i) => [
				pos,
				[i % 2 === 0 ? -0 : Infinity, Number.NaN],
			]),
		),
	] as Record<string, number[]>[];
	for (const weights of cases) {
		const original = ovrByPosFactory(weights, -4.7, (value) => value);
		const prepared = prepareOvr(players, weights, -4.7)!;
		assert(
			Object.is(prepared.baseline, original(players, { wholeRoster: true })),
		);
		for (const i of [2, 11, 5, 20, 2, 5]) {
			const candidate = makePlayer(i, values[i % values.length]!);
			const expected = original([...players, candidate], { wholeRoster: true });
			assert(Object.is(prepared.withPlayer(candidate), expected));
		}
	}
});

test("nonfinite values and unsupported positions request the original evaluator", () => {
	const players = [makePlayer(1, 50), makePlayer(2, 45)];
	const prepared = prepareWholeRoster(players)!;
	for (const value of [
		Number.NaN,
		Infinity,
		-Infinity,
		undefined,
		null,
		"45",
	]) {
		const invalid = makePlayer(3, value as number);
		assert.strictEqual(prepareWholeRoster([...players, invalid]), undefined);
		assert.strictEqual(prepared.withPlayer(invalid), undefined);
	}
	for (const pos of ["unknown", "constructor", "__proto__", "0"]) {
		const invalid = makePlayer(3, 50);
		invalid.ratings.pos = pos;
		assert.strictEqual(prepareWholeRoster([...players, invalid]), undefined);
		assert.strictEqual(prepared.withPlayer(invalid), undefined);
	}
	const missingOvrs = {
		...players[0]!,
		ratings: { ...players[0]!.ratings, ovrs: undefined },
	};
	assert.strictEqual(prepareWholeRoster([missingOvrs]), undefined);
	assert.strictEqual(prepared.withPlayer(missingOvrs), undefined);
});

test("each candidate gets fresh depth charts, and a new batch sees changed base values", () => {
	const players = Array.from({ length: 24 }, (_, i) => makePlayer(i, 20 + i));
	const candidate = makePlayer(30, 50);
	for (let batch = 0; batch < 3; batch++) {
		const prepared = prepareWholeRoster(players)!;
		assert(Object.is(prepared.baseline, ovr(players, { wholeRoster: true })));
		for (const pos of POSITIONS) {
			candidate.ratings.pos = pos;
			candidate.ratings.ovrs[pos] = 100;
			candidate.value += 1;
			candidate.pid = (candidate.pid ?? 0) - 1;
			assert(
				Object.is(
					prepared.withPlayer(candidate),
					ovr([...players, candidate], { wholeRoster: true }),
				),
			);
		}
		players[0]!.value += 40;
		players[0]!.ratings.pos = "C";
		players[0]!.ratings.ovrs.C = 100;
	}
});
