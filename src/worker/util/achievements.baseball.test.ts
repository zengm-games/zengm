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

	test("group specificity issue", async () => {
		const tid = g.get("userTid");

		const awards = makeAwards({
			season: 2013,
			awards: [
				defaultAwards.mvp,
				defaultAwards.mvp,
				defaultAwardsBaseball.poy,
				defaultAwardsBaseball.rpoy,
				defaultAwardsBaseball.roy,
				defaultAwards.fmvp,
			].map((award, i) => {
				// First it will see a leaguewide MVP award that the user doesn't win, even though they do win the normal conference one below, which is still enough to win the award
				if (i === 0) {
					return {
						...award,
						group: undefined,
						winner: [{ pid: 1, tid: tid + 1 }],
					};
				}

				if (typeof award.statRange === "number") {
					// FMVP has no group
					return {
						...award,
						group: undefined,
						winner: [{ pid: 0, tid, statOverrides: { score: 5 } }],
					};
				}

				return {
					...award,
					group: {
						type: "conf",
						cid: 0,
					},
					winner: [{ pid: 0, tid }],
				};
			}),
		});

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, true);
	});
});
