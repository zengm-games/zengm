import { assert, beforeEach, test } from "vitest";
import ovrByPosFactory from "./ovrByPosFactory.ts";
import { resetG } from "../../../test/helpers.ts";
import { POSITIONS } from "../../../common/constants.baseball.ts";

beforeEach(resetG);

test("team overall retains position accumulation order and scale for depleted teams", () => {
	const weights = Object.fromEntries(POSITIONS.map((pos) => [pos, [0.005]]));
	weights.C = [0.007];
	weights["1B"] = [0.003];
	const ovr = ovrByPosFactory(
		weights,
		-4.7,
		(value) => (value * 100) / 1.8 + 50,
	);
	const players = [80, 20, 60].map((value, pid) => ({
		pid,
		value,
		ratings: {
			pos: "LF",
			ovr: value,
			ovrs: Object.fromEntries(POSITIONS.map((pos) => [pos, value])),
		},
	}));
	const before = structuredClone(players);
	const raw = -4.7 + 0.007 * 80 + 0.003 * 60 + 0.005 * 20;
	assert.strictEqual(ovr(players, {}), (raw * 100) / 1.8 + 50);
	assert.strictEqual(ovr(players, { wholeRoster: true }), raw);
	assert.strictEqual(ovr(players, { onlyPos: "C" }), -4.7 + 0.007 * 80);
	assert.deepEqual(players, before);
});

test("empty teams preserve the intercept and optional scaling", () => {
	const ovr = ovrByPosFactory({}, 7, (value) => value * 2);
	assert.strictEqual(ovr([], {}), 14);
	assert.strictEqual(ovr([], { wholeRoster: true }), 7);
	assert.strictEqual(ovr([], { onlyPos: "SP" }), 7);
});
