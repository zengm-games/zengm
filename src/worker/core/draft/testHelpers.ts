import assert from "assert";
import sampleTiebreakers from "../../../test/fixtures/sampleTiebreakers";
import testHelpers from "../../../test/helpers";
import { draft } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { Team, TeamSeasonWithoutKey } from "../../../common/types";

const getDraftTids = async () => {
	await draft.genOrder();
	const draftPicks = await draft.getOrder();
	assert.strictEqual(draftPicks.length, 60);
	return draftPicks.map(d => d.originalTid);
};

const loadTeamSeasons = async () => {
	testHelpers.resetG();
	await testHelpers.resetCache();
	g.setWithoutSavingToDB("draftType", "nba1994"); // Load static data

	for (const st of sampleTiebreakers) {
		const copied = helpers.deepCopy(st);
		// @ts-ignore
		delete copied.stats;
		const { seasons, ...partialT } = copied;

		const t = {
			...partialT,
			adjustForInflation: true,
			disabled: false,
			keepRosterSorted: true,
			colors: ["#000000", "#000000", "#000000"],
			playThroughInjuries: [0, 0],
		} as Team;

		const teamSeasons = seasons.map(teamSeason => ({
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
