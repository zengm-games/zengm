import { assert, beforeAll, describe, test } from "vitest";
import { PLAYER } from "../../../common/constants.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import type { DraftType } from "../../../common/types.ts";
import { last } from "../../../common/utils.ts";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local } from "../../util/index.ts";
import { player, team } from "../index.ts";
import { ValueChangeCalculator } from "./ValueChangeCalculator.ts";

const NUM_TEAMS = 30;
const NUM_ROUNDS = 2;

// Two AI teams, for evaluating trades without any of the special logic for trading with the user
const TID = 15;
const TRADING_PARTNER_TID = 16;

// dpids[tid][round]
const dpids: number[][] = [];

beforeAll(async () => {
	resetG();
	g.setWithoutSavingToDB("playIn", true);
	const season = g.get("season");

	const players = [];

	// Higher tid means better team, so tid 0 is projected to be the worst team and tid 29 the best
	for (let tid = 0; tid < NUM_TEAMS; tid++) {
		for (let i = 0; i < 10; i++) {
			const p = player.generate(tid, 25, season - 5, true, DEFAULT_LEVEL);
			last(p.ratings).ovr = 40 + tid;
			p.value = 40 + tid;
			players.push(p);
		}
	}

	// Draft prospects, with the biggest differences in value at the top of the draft
	for (let i = 0; i < NUM_TEAMS * NUM_ROUNDS + 10; i++) {
		const p = player.generate(
			PLAYER.UNDRAFTED,
			19,
			season,
			false,
			DEFAULT_LEVEL,
		);
		p.value = 73.5 - 17.5 * Math.sqrt(i / 60);
		players.push(p);
	}

	await resetCache({
		players,
		teams: helpers.getTeamsDefault().map(team.generate),
	});
	idb.league = mockIDBLeague();
	local.playerOvrMeanStdStale = true;

	for (let tid = 0; tid < NUM_TEAMS; tid++) {
		dpids[tid] = [];
		for (let round = 1; round <= NUM_ROUNDS; round++) {
			dpids[tid]![round] = await idb.cache.draftPicks.add({
				tid,
				originalTid: tid,
				round,
				pick: 0,
				season,
			});
		}
	}
});

// Value to an AI team of getting the draft pick of each team for free
const getPickValues = async (draftType: DraftType, round: number) => {
	g.setWithoutSavingToDB("draftType", draftType);

	const valueChangeCalculator = new ValueChangeCalculator();

	const values = [];
	for (let tid = 0; tid < NUM_TEAMS; tid++) {
		values.push(
			await valueChangeCalculator.evaluate({
				tid: TID,
				pidsAdd: [],
				pidsRemove: [],
				dpidsAdd: [dpids[tid]![round]!],
				dpidsRemove: [],
				tradingPartnerTid: TRADING_PARTNER_TID,
			}),
		);
	}

	return values;
};

// tid 0 is skipped in these tests because that's the user's team, and its picks are valued differently

const assertDescending = (values: number[], tids: number[]) => {
	for (let i = 1; i < tids.length; i++) {
		assert.isAbove(
			values[tids[i - 1]!]!,
			values[tids[i]!]!,
			`tid ${tids[i - 1]} vs ${tids[i]}`,
		);
	}
};

const assertAllEqual = (values: number[]) => {
	for (const value of values.slice(1)) {
		assert.closeTo(value, values[1]!, 1e-6);
	}
};

describe("first round", () => {
	test("worse teams have more valuable picks", async () => {
		for (const draftType of ["noLottery", "nba2019"] as const) {
			const values = await getPickValues(draftType, 1);
			assertDescending(values, [1, 10, 20, 29]);
		}

		// In nba2027, the worst teams have worse lottery odds than the other lottery teams, so only look at the rest
		const values = await getPickValues("nba2027", 1);
		assertDescending(values, [10, 20, 29]);
	});

	test("lottery makes the picks of the worst teams less valuable and the picks of other lottery teams more valuable", async () => {
		const noLottery = await getPickValues("noLottery", 1);
		const nba2019 = await getPickValues("nba2019", 1);
		const nba2027 = await getPickValues("nba2027", 1);

		assert.isBelow(nba2019[1]!, noLottery[1]!);
		assert.isAbove(nba2019[10]!, noLottery[10]!);

		// nba2027 is even flatter
		assert.isBelow(nba2027[1]!, nba2019[1]!);
		assert.isAbove(nba2027[10]!, nba2019[10]!);
	});

	test("teams projected to barely make the playoffs still might wind up in the lottery", async () => {
		for (const draftType of ["nba2019", "nba2027"] as const) {
			const values = await getPickValues(draftType, 1);
			assert.isAbove(values[17]!, 2 * values[29]!);
		}
	});

	test("better teams have more valuable picks in noLotteryReverse", async () => {
		const values = await getPickValues("noLotteryReverse", 1);
		assertDescending(values, [28, 20, 10, 1]);
	});

	test("all picks have the same value in random", async () => {
		const values = await getPickValues("random", 1);
		assertAllEqual(values);
	});

	test("same inputs give the same output", async () => {
		const values = await getPickValues("nba2027", 1);
		const values2 = await getPickValues("nba2027", 1);
		assert.deepStrictEqual(values, values2);
	});
});

describe("second round", () => {
	test("worse teams have more valuable picks", async () => {
		for (const draftType of ["noLottery", "nba2019"] as const) {
			const values = await getPickValues(draftType, 2);
			assertDescending(values, [1, 12, 25]);
		}
	});

	test("lottery teams are in reverse order in nba2027", async () => {
		const values = await getPickValues("nba2027", 2);
		assertDescending(values, [12, 1]);
		assertDescending(values, [12, 25]);
	});

	test("better teams have more valuable picks in noLotteryReverse", async () => {
		const values = await getPickValues("noLotteryReverse", 2);
		assertDescending(values, [25, 12, 1]);
	});

	test("all picks have the same value in random", async () => {
		const values = await getPickValues("random", 2);
		assertAllEqual(values);
	});
});

describe("trading with the user", () => {
	// How much does an AI team value its own first round pick, when trading it to another team?
	const getOwnPickValue = async (
		draftType: DraftType,
		tradingPartnerTid: number,
	) => {
		g.setWithoutSavingToDB("draftType", draftType);

		const dv = await new ValueChangeCalculator().evaluate({
			tid: TID,
			pidsAdd: [],
			pidsRemove: [],
			dpidsAdd: [],
			dpidsRemove: [dpids[TID]![1]!],
			tradingPartnerTid,
		});

		return -dv;
	};

	test("in a random draft, all picks are worth the same even when trading with the user", async () => {
		g.setWithoutSavingToDB("draftType", "random");
		const userTid = g.get("userTid");

		const evaluate = async (
			tid: number,
			tradingPartnerTid: number,
			dpidsAdd: number[],
			dpidsRemove: number[],
		) => {
			const dv = await new ValueChangeCalculator().evaluate({
				tid,
				pidsAdd: [],
				pidsRemove: [],
				dpidsAdd,
				dpidsRemove,
				tradingPartnerTid,
			});
			return Math.abs(dv);
		};

		// A bad team and a good team, with the same strategy so they value picks the same
		const tidBad = 2;
		const tidGood = 27;
		for (const tid of [tidBad, tidGood]) {
			const t = (await idb.cache.teams.get(tid))!;
			t.strategy = "rebuilding";
			await idb.cache.teams.put(t);
		}

		const badWithAi = await evaluate(
			tidBad,
			TRADING_PARTNER_TID,
			[],
			[dpids[tidBad]![1]!],
		);
		const badWithUser = await evaluate(
			tidBad,
			userTid,
			[],
			[dpids[tidBad]![1]!],
		);
		const goodWithUser = await evaluate(
			tidGood,
			userTid,
			[],
			[dpids[tidGood]![1]!],
		);
		const badGetsUserPick = await evaluate(
			tidBad,
			userTid,
			[dpids[userTid]![1]!],
			[],
		);

		assert.closeTo(badWithUser, badWithAi, 1e-6);
		assert.closeTo(goodWithUser, badWithAi, 1e-6);
		assert.closeTo(badGetsUserPick, badWithAi, 1e-6);
	});

	test("AI teams value their picks more when trading with the user, even with a lottery that makes most picks similar", async () => {
		for (const draftType of ["noLottery", "nba2019", "nba2027"] as const) {
			const withAi = await getOwnPickValue(draftType, TRADING_PARTNER_TID);
			const withUser = await getOwnPickValue(draftType, g.get("userTid"));
			assert.isAbove(withUser, 2 * withAi, draftType);
		}
	});
});
