import assert from "assert";
import testHelpers from "../../../test/helpers";
import lotterySort from "./lotterySort";
import { g, helpers } from "../../util";
import { team } from "..";
import { idb } from "../../db";

describe("worker/core/draft/lotterySort", () => {
	test("projects playoff appearances when sorting for a projected lottery", async () => {
		testHelpers.resetG();
		g.setWithoutSavingToDB("numGamesPlayoffSeries", [7]);

		// Two top teams are in the same conference. Only one will make the playoffs.
		const teamInfo = [
			{
				tid: 0,
				seasonAttrs: {
					cid: 0,
					did: 0,
					won: 9,
					lost: 1,
				},
			},
			{
				tid: 1,
				seasonAttrs: {
					cid: 0,
					did: 0,
					won: 8,
					lost: 2,
				},
			},
			{
				tid: 2,
				seasonAttrs: {
					cid: 1,
					did: 1,
					won: 1,
					lost: 9,
				},
			},
			{
				tid: 3,
				seasonAttrs: {
					cid: 1,
					did: 1,
					won: 2,
					lost: 8,
				},
			},
		];

		const teamsDefault = helpers.getTeamsDefault().slice(0, teamInfo.length);
		for (let i = 0; i < teamsDefault.length; i++) {
			teamsDefault[i].cid = teamInfo[i].seasonAttrs.cid;
			teamsDefault[i].did = teamInfo[i].seasonAttrs.did;
		}

		const teamSeasons = teamsDefault.map(t => team.genSeasonRow(t));
		for (let i = 0; i < teamsDefault.length; i++) {
			teamSeasons[i].won = teamInfo[i].seasonAttrs.won;
			teamSeasons[i].lost = teamInfo[i].seasonAttrs.lost;
		}

		await testHelpers.resetCache({
			teams: teamsDefault.map(team.generate),
			teamSeasons,
		});

		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid"],
			seasonAttrs: [
				"playoffRoundsWon",
				"cid",
				"did",
				"won",
				"lost",
				"tied",
				"otl",
				"winp",
				"wonDiv",
				"lostDiv",
				"tiedDiv",
				"otlDiv",
				"wonConf",
				"lostConf",
				"tiedConf",
				"otlConf",
			],
			stats: ["pts", "oppPts", "gp"],
			season: g.get("season"),
		});

		await lotterySort(teams);

		assert.deepStrictEqual(
			teams.map(t => t.tid),
			[2, 1, 3, 0],
		);
	});
});
