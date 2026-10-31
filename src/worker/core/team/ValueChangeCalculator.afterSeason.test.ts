import { assert, beforeAll, test } from "vitest";
import { PHASE, PLAYER } from "../../../common/constants.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { last } from "../../../common/utils.ts";
import { mockIDBLeague, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g, local } from "../../util/index.ts";
import { loadTeamSeasons } from "../draft/testHelpers.ts";
import { player } from "../index.ts";
import { ValueChangeCalculator } from "./ValueChangeCalculator.ts";

// After the regular season is over, the order of teams going into the draft is known, so it should be used rather than a projection

// dpids of first round picks in this season's draft, by tid
const dpids: Record<number, number> = {};

beforeAll(async () => {
	resetG();
	idb.league = mockIDBLeague();

	// 30 teams with real-ish records and playoff results
	await loadTeamSeasons();

	const season = g.get("season");

	for (let tid = 0; tid < g.get("numActiveTeams"); tid++) {
		for (let i = 0; i < 5; i++) {
			const p = player.generate(tid, 25, season - 5, true, DEFAULT_LEVEL);

			// Spread of ratings, so draft prospects can be compared to something
			const ovr = 40 + ((tid + 7 * i) % 30);
			last(p.ratings).ovr = ovr;
			p.value = ovr;

			await idb.cache.players.add(p);
		}
	}

	// Draft prospects, with the biggest differences in value at the top of the draft
	for (let i = 0; i < 70; i++) {
		const p = player.generate(
			PLAYER.UNDRAFTED,
			19,
			season,
			false,
			DEFAULT_LEVEL,
		);
		p.value = 73.5 - 17.5 * Math.sqrt(i / 60);
		await idb.cache.players.add(p);
	}
	local.playerOvrMeanStdStale = true;

	for (const dp of await idb.cache.draftPicks.getAll()) {
		if (dp.season === season && dp.round === 1) {
			dpids[dp.originalTid] = dp.dpid;
		}
	}

	g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
	g.setWithoutSavingToDB("draftType", "nba2019");
});

// Value to an AI team of getting the draft pick of another team for free
const getPickValue = (
	valueChangeCalculator: ValueChangeCalculator,
	tid: number,
) => {
	return valueChangeCalculator.evaluate({
		tid: 5,
		pidsAdd: [],
		pidsRemove: [],
		dpidsAdd: [dpids[tid]!],
		dpidsRemove: [],
		tradingPartnerTid: 6,
	});
};

test("lottery is based on who actually made the playoffs, not just record", async () => {
	const valueChangeCalculator = new ValueChangeCalculator();

	// Worst team in the league
	const worst = await getPickValue(valueChangeCalculator, 16);

	// Missed the playoffs, despite having a better record than some playoff teams
	const lotteryGoodRecord = await getPickValue(valueChangeCalculator, 17);

	// Made the playoffs with a worse record than the above team
	const playoffsBadRecord = await getPickValue(valueChangeCalculator, 23);

	assert.isAbove(worst, lotteryGoodRecord);
	assert.isAbove(lotteryGoodRecord, playoffsBadRecord);
});

test("same inputs give the same output, even though genOrder simulates a random lottery", async () => {
	const values = [];
	for (let i = 0; i < 5; i++) {
		values.push(await getPickValue(new ValueChangeCalculator(), 16));
	}
	for (const value of values) {
		assert.strictEqual(value, values[0]);
	}
});
