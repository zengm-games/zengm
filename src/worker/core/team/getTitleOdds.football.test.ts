import { afterAll, assert, beforeAll, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { simTitleOdds } from "./getTitleOdds.ts";

const seriesTeam = (tid: number, seed: number) => ({
	cid: 0,
	seed,
	tid,
	won: 0,
});

const getTeams = () =>
	helpers.getTeamsDefault().map((t) => ({
		eliminated: false,
		gamesLeft: 0,
		ovr: 50 + t.tid,
		teamSeason: { tid: t.tid, cid: t.cid, did: t.did } as any,
	}));

beforeAll(async () => {
	resetG();
	await resetCache({});
	idb.league = mockIDBLeague();
});

afterAll(() => {
	// @ts-expect-error
	idb.league = undefined;
	resetG();
});

for (const numGamesPlayoffSeries of [
	[1, 1, 1, 1],
	[3, 5, 7, 7],
]) {
	test(`handles rounds of ${numGamesPlayoffSeries.join(",")}`, async () => {
		g.setWithoutSavingToDB(
			"numGamesPlayoffSeries",
			numGamesPlayoffSeries as any,
		);

		const first = Array.from({ length: 8 }, (_, i) => ({
			home: seriesTeam(i, i + 1),
			away: seriesTeam(15 - i, 16 - i),
		}));
		const odds = (await simTitleOdds({
			numSims: 200,
			playoffSeries: {
				currentRound: 0,
				series: [first, [], [], []],
			},
			season: g.get("season"),
			teams: getTeams(),
		}))!;

		const total = Object.values(odds).reduce((sum, t) => sum + t.prob, 0);
		assert.closeTo(total, 1, 1e-9);
		assert.strictEqual(odds[20]!.prob, 0);
	});
}
