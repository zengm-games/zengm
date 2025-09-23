import { assert } from "vitest";
import sampleTiebreakers from "../../../test/fixtures/sampleTiebreakers.ts";
import testHelpers from "../../../test/helpers.ts";
import { draft } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import type { Team, TeamSeasonWithoutKey } from "../../../common/types.ts";
import { DEFAULT_STADIUM_CAPACITY } from "../../../common/constants.ts";

const getDraftTids = async () => {
	await draft.genOrder();
	const draftPicks = await draft.getOrder();
	assert.strictEqual(draftPicks.length, 60);
	return draftPicks.map((d) => d.originalTid);
};

const loadTeamSeasons = async () => {
	testHelpers.resetG();
	await testHelpers.resetCache();
	g.setWithoutSavingToDB("draftType", "nba1994");

	for (const st of sampleTiebreakers) {
		const copied = helpers.deepCopy(st);
		// @ts-expect-error
		delete copied.stats;
		const { seasons, ...partialT } = copied;

		const t = {
			...partialT,
			adjustForInflation: true,
			disabled: false,
			keepRosterSorted: true,
			colors: ["#000000", "#000000", "#000000"],
			playThroughInjuries: [0, 0],
			initialBudget: partialT.budget,
			pop: 1,
			stadiumCapacity: DEFAULT_STADIUM_CAPACITY,
		} as Team;

		const teamSeasons = seasons.map((teamSeason) => ({
			...teamSeason,
			tid: t.tid,
			tied: 0,
			tiedHome: 0,
			tiedAway: 0,
			tiedConf: 0,
			tiedDiv: 0,
			otl: 0,
			otlHome: 0,
			otlAway: 0,
			otlConf: 0,
			otlDiv: 0,
			stadiumCapacity: 50000,
			abbrev: t.abbrev,
			name: t.name,
			region: t.region,
			cid: t.cid,
			did: t.did,
			colors: t.colors,
			numPlayersTradedAway: 0,
		})) as TeamSeasonWithoutKey[];

		for (const teamSeason of teamSeasons) {
			await idb.cache.teamSeasons.add(teamSeason);
		}

		await idb.cache.teams.add(t);
	}

	await draft.genPicks();
};

export { getDraftTids, loadTeamSeasons };
