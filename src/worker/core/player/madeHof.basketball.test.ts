import { assert, test } from "vitest";
import testHelpers from "../../../test/helpers.ts";
import { player } from "../index.ts";
import madeHofBasketball from "./madeHof.basketball.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";

test("narrowly make HoF based on dominance factor", () => {
	testHelpers.resetG();
	const p = player.generate(0, 19, 2012, false, DEFAULT_LEVEL);
	p.stats = [
		{
			dws: 5,
			ows: 5,
			ewa: 10,
		},
		{
			dws: 5,
			ows: 5,
			ewa: 10,
		},
		{
			dws: 5,
			ows: 5,
			ewa: 11,
		},
		{
			dws: 7,
			ows: 7,
			ewa: 14,
		},
		{
			dws: 7,
			ows: 7,
			ewa: 14,
		},
		{
			dws: 7,
			ows: 7,
			ewa: 14,
		},
		{
			dws: 7,
			ows: 7,
			ewa: 14,
		},
		{
			dws: 7,
			ows: 7,
			ewa: 14,
		},
	];
	assert.strictEqual(madeHofBasketball(p), true);
});

test("narrowly miss HoF based on dominance factor", () => {
	const p = player.generate(0, 19, 2012, false, DEFAULT_LEVEL);
	p.stats = [
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
		{
			dws: 4,
			ows: 4,
			ewa: 8,
		},
	];
	assert.strictEqual(madeHofBasketball(p), false);
});
