import { afterAll, assert, beforeAll, describe, test } from "vitest";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import {
	defaultAwards,
	defaultAwardsBaseball,
} from "../../common/defaultGameAttributes.ts";
import {
	cbAfterAll,
	cbBeforeAll,
	get,
	makeAwards,
} from "./achievementTestHelpers.ts";

describe("checkAchievement", () => {
	beforeAll(cbBeforeAll);
	afterAll(cbAfterAll);

	describe("triple_crown", () => {
		test("award achievement if same player wins mvp and fmvp and makes the All-Defensive team, on users team", async () => {
			const tid = g.get("userTid");
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwards.mvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwards.fmvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwardsBaseball.def,
						group: undefined,
						winner: [[{ pid: 0, tid }]],
					},
				],
			});

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award if not on All-Defensive team", async () => {
			const tid = g.get("userTid");
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwards.mvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwards.fmvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwardsBaseball.def,
						group: undefined,
						winner: [[{ pid: 1, tid }]],
					},
				],
			});

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});
	});
});
