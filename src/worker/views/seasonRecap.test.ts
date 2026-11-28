import { afterAll, assert, beforeEach, test } from "vitest";
import { helpers } from "../util/index.ts";
import { idb } from "../db/index.ts";
import g from "../util/g.ts";
import { team } from "../core/index.ts";
import { PHASE } from "../../common/constants.ts";
import { mockIDBLeague, resetCache, resetG } from "../../test/helpers.ts";
import seasonRecap from "./seasonRecap.ts";

const load = (season: number) =>
	seasonRecap.load({
		conditions: {},
		inputs: { season },
		prevInputs: undefined,
		prevOutput: {},
		updateEvents: new Set(["firstRun"]),
	});

beforeEach(async () => {
	resetG();
	g.setWithoutSavingToDB("phase", PHASE.DRAFT);

	const teamsDefault = helpers.getTeamsDefault();
	await resetCache({
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
		players: [
			{
				pid: 0,
				tid: 3,
				firstName: "Test",
				lastName: "Player",
				stats: [],
				statsTids: [3],
				ratings: [],
				awards: [],
				draft: { year: g.get("season") - 5 },
				retiredYear: Infinity,
			},
		],
	});
	await idb.cache.awards.put({
		season: g.get("season"),
		awards: [
			{
				name: "Most Valuable Player",
				winner: [{ pid: 0, tid: 3 }],
				showStats: "mvp",
				statRange: "regularSeason",
			},
		],
		bestRecordConfs: {},
		bestRecord: 0,
	} as any);
	idb.league = mockIDBLeague();
});

afterAll(() => {
	// @ts-expect-error
	idb.league = undefined;
});

test("names the award winners of a completed season", async () => {
	const data = await load(g.get("season"));
	assert.strictEqual(data?.notCompleted, false);
	assert.strictEqual(data?.invalidSeason, false);
	assert.deepStrictEqual(data?.awardWinners?.[0]?.winner, {
		abbrev: helpers.getTeamsDefault()[3]!.abbrev,
		name: "Test Player",
		pid: 0,
		tid: 3,
	});
});

test("waits for the season to finish", async () => {
	g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
	const data = await load(g.get("season"));
	assert.strictEqual(data?.notCompleted, true);
});
