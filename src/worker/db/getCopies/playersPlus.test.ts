import assert from "assert";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player } from "../../core";
import { idb } from "..";
import { g, helpers } from "../../util";

describe("worker/db/getCopies/playersPlus", () => {
	let p: any;
	beforeAll(async () => {
		testHelpers.resetG();
		g.setWithoutSavingToDB("season", 2011);
		p = player.generate(PLAYER.UNDRAFTED, 19, 2011, false, 28);
		p.tid = 4;
		g.setWithoutSavingToDB("season", 2012);
		await testHelpers.resetCache({
			players: [p],
		});
		p.contract.exp = g.get("season") + 1;
		await player.addStatsRow(p);
		await player.addStatsRow(p, true);
		await player.addStatsRow(p);
		const stats = p.stats;
		stats[0].gp = 5;
		stats[0].fg = 20;
		stats[1].gp = 3;
		stats[1].fg = 30;
		stats[2].season = 2013;
		stats[2].tid = 0;
		stats[2].gp = 8;
		stats[2].fg = 56;
		await player.develop(p, 0);
		player.addRatingsRow(p, 15);
		await player.develop(p, 0);
		player.addRatingsRow(p, 15);
		p.ratings[2].season = 2013;
		await player.develop(p, 0);
		player.addRatingsRow(p, 15);
		p.ratings[3].season = 2014;
		await player.develop(p, 0);
	});

	test("return requested info if tid/season match", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "abbrev", "fg", "fgp", "per"],
			tid: 4,
			season: 2012,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.tid, 4);
		assert.strictEqual(pf.awards.length, 0);
		assert.strictEqual(pf.ratings.season, 2012);
		assert.strictEqual(typeof pf.ratings.ovr, "number");
		assert.strictEqual(Object.keys(pf.ratings).length, 2);
		assert.strictEqual(pf.stats.season, 2012);
		assert.strictEqual(pf.stats.abbrev, "CIN");
		assert.strictEqual(typeof pf.stats.fg, "number");
		assert.strictEqual(typeof pf.stats.fgp, "number");
		assert.strictEqual(typeof pf.stats.per, "number");
		assert.strictEqual(Object.keys(pf.stats).length, 6);
		assert(!pf.hasOwnProperty("careerStats"));
		assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
	});

	test("return requested info if tid/season match for an array of player objects", async () => {
		const pf = await idb.getCopies.playersPlus([p, p], {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "abbrev", "fg", "fgp", "per"],
			tid: 4,
			season: 2012,
		});

		for (let i = 0; i < 2; i++) {
			assert.strictEqual(pf[i].tid, 4);
			assert.strictEqual(pf[i].awards.length, 0);
			assert.strictEqual(pf[i].ratings.season, 2012);
			assert.strictEqual(typeof pf[i].ratings.ovr, "number");
			assert.strictEqual(Object.keys(pf[i].ratings).length, 2);
			assert.strictEqual(pf[i].stats.season, 2012);
			assert.strictEqual(pf[i].stats.abbrev, "CIN");
			assert.strictEqual(typeof pf[i].stats.fg, "number");
			assert.strictEqual(typeof pf[i].stats.fgp, "number");
			assert.strictEqual(typeof pf[i].stats.per, "number");
			assert.strictEqual(Object.keys(pf[i].stats).length, 6);
			assert(!pf[i].hasOwnProperty("careerStats"));
			assert(!pf[i].hasOwnProperty("careerStatsPlayoffs"));
		}
	});

	test("return requested info if tid/season match, even when no attrs requested", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			ratings: ["season", "ovr"],
			stats: ["season", "abbrev", "fg", "fgp", "per"],
			tid: 4,
			season: 2012,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.ratings.season, 2012);
		assert.strictEqual(typeof pf.ratings.ovr, "number");
		assert.strictEqual(Object.keys(pf.ratings).length, 2);
		assert.strictEqual(pf.stats.season, 2012);
		assert.strictEqual(pf.stats.abbrev, "CIN");
		assert.strictEqual(typeof pf.stats.fg, "number");
		assert.strictEqual(typeof pf.stats.fgp, "number");
		assert.strictEqual(typeof pf.stats.per, "number");
		assert.strictEqual(Object.keys(pf.stats).length, 6);
		assert(!pf.hasOwnProperty("careerStats"));
		assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
	});

	test("return requested info if tid/season match, even when no ratings requested", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			stats: ["season", "abbrev", "fg", "fgp", "per"],
			tid: 4,
			season: 2012,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.tid, 4);
		assert.strictEqual(pf.awards.length, 0);
		assert(!pf.hasOwnProperty("ratings"));
		assert.strictEqual(pf.stats.season, 2012);
		assert.strictEqual(pf.stats.abbrev, "CIN");
		assert.strictEqual(typeof pf.stats.fg, "number");
		assert.strictEqual(typeof pf.stats.fgp, "number");
		assert.strictEqual(typeof pf.stats.per, "number");
		assert.strictEqual(Object.keys(pf.stats).length, 6);
		assert(!pf.hasOwnProperty("careerStats"));
		assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
	});

	test("return requested info if tid/season match, even when no stats requested", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			tid: 4,
			season: 2012,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.tid, 4);
		assert.strictEqual(pf.awards.length, 0);
		assert.strictEqual(pf.ratings.season, 2012);
		assert.strictEqual(typeof pf.ratings.ovr, "number");
		assert.strictEqual(Object.keys(pf.ratings).length, 2);
		assert(!pf.hasOwnProperty("stats"));
		assert(!pf.hasOwnProperty("careerStats"));
		assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
	});

	test("return undefined if tid does not match any on record", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "abbrev", "fg", "fgp", "per"],
			tid: 5,
			season: 2012,
		});
		assert.strictEqual(typeof pf, "undefined");
	});

	test("return undefined if season does not match any on record", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "abbrev", "fg", "fgp", "per"],
			tid: 4,
			season: 2014,
		});
		assert.strictEqual(typeof pf, "undefined");
	});
	test('return season totals is options.statType is "totals", and per-game averages otherwise', async () => {
		let pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 4,
			season: 2012,
			statType: "totals",
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.stats.gp, 5);
		assert.strictEqual(pf.stats.fg, 20);
		pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 4,
			season: 2012,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.stats.gp, 5);
		assert.strictEqual(pf.stats.fg, 4);
	});

	test("return playoff stats if options.playoffs is true", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 4,
			season: 2012,
			playoffs: true,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.stats[0].playoffs, false);
		assert.strictEqual(pf.stats[0].gp, 5);
		assert.strictEqual(pf.stats[0].fg, 4);
		assert.strictEqual(pf.stats[1].playoffs, true);
		assert.strictEqual(pf.stats[1].gp, 3);
		assert.strictEqual(pf.stats[1].fg, 10);
	});

	test("not return undefined with options.showNoStats even if tid does not match any on record", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 5,
			season: 2012,
			showNoStats: true,
		});
		assert.strictEqual(typeof pf, "object");
	});

	test("not return undefined with options.showNoStats if season does not match any on record", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 4,
			season: 2015,
			showNoStats: true,
		});
		assert.strictEqual(typeof pf, "object");
	});

	test("not return undefined with options.showRookies if the player was drafted this season", async () => {
		g.setWithoutSavingToDB("season", 2011);
		let pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 5,
			season: 2011,
			showRookies: true,
		});
		assert.strictEqual(typeof pf, "object");
		g.setWithoutSavingToDB("season", 2012);
		pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 5,
			season: 2011,
			showRookies: true,
		});
		assert.strictEqual(typeof pf, "undefined");
	});

	test("fuzz ratings if options.fuzz is true", async () => {
		let pf = await idb.getCopy.playersPlus(p, {
			ratings: ["ovr"],
			tid: 4,
			season: 2012,
			fuzz: false,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.ratings.ovr, p.ratings[1].ovr);
		pf = await idb.getCopy.playersPlus(p, {
			ratings: ["ovr"],
			tid: 4,
			season: 2012,
			fuzz: true,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		// This will break if ovr + fuzz is over 100 (should check bounds), but that never happens in practice
		assert.strictEqual(
			pf.ratings.ovr,
			Math.round(p.ratings[1].ovr + p.ratings[1].fuzz),
		);
	});

	test("return stats from previous season if options.oldStats is true and current season has no stats record", async () => {
		g.setWithoutSavingToDB("season", 2013);
		let pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 0,
			season: 2013,
			oldStats: true,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.stats.gp, 8);
		assert.strictEqual(pf.stats.fg, 7);
		pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 0,
			season: 2014,
			oldStats: false,
		});
		assert.strictEqual(typeof pf, "undefined");
		g.setWithoutSavingToDB("season", 2014);
		pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 0,
			season: 2014,
			oldStats: true,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.stats.gp, 8);
		assert.strictEqual(pf.stats.fg, 7);
		g.setWithoutSavingToDB("season", 2012);
	});

	test("adjust cashOwed by options.numGamesRemaining", async () => {
		g.setWithoutSavingToDB("season", 2012);
		let pf = await idb.getCopy.playersPlus(p, {
			attrs: ["cashOwed"],
			tid: 4,
			season: 2012,
			numGamesRemaining: 82,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.cashOwed, (p.contract.amount * 2) / 1000);
		pf = await idb.getCopy.playersPlus(p, {
			attrs: ["cashOwed"],
			tid: 4,
			season: 2012,
			numGamesRemaining: 41,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.cashOwed, (p.contract.amount * 1.5) / 1000);
		pf = await idb.getCopy.playersPlus(p, {
			attrs: ["cashOwed"],
			tid: 4,
			season: 2012,
			numGamesRemaining: 0,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.cashOwed, p.contract.amount / 1000);
	});

	test("return stats and ratings from all seasons and teams if no season or team is specified", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "abbrev", "fg"],
			statType: "totals",
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.tid, 4);
		assert.strictEqual(pf.awards.length, 0);
		assert.strictEqual(pf.ratings[0].season, 2011);
		assert.strictEqual(typeof pf.ratings[0].ovr, "number");
		assert.strictEqual(pf.ratings[1].season, 2012);
		assert.strictEqual(typeof pf.ratings[1].ovr, "number");
		assert.strictEqual(pf.ratings[2].season, 2013);
		assert.strictEqual(typeof pf.ratings[2].ovr, "number");
		assert.strictEqual(pf.stats[0].season, 2012);
		assert.strictEqual(pf.stats[0].abbrev, "CIN");
		assert.strictEqual(pf.stats[0].fg, 20);
		assert.strictEqual(pf.stats[1].season, 2013);
		assert.strictEqual(pf.stats[1].abbrev, "ATL");
		assert.strictEqual(pf.stats[1].fg, 56);
		assert.strictEqual(pf.careerStats.fg, 76);
		assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
	});

	test("return stats and ratings from all seasons with a specific team if no season is specified but a team is", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "abbrev", "fg"],
			tid: 4,
			statType: "totals",
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.tid, 4);
		assert.strictEqual(pf.awards.length, 0);
		assert.strictEqual(pf.ratings[0].season, 2012);
		assert.strictEqual(typeof pf.ratings[0].ovr, "number");
		assert.strictEqual(pf.ratings.length, 1);
		assert.strictEqual(pf.stats[0].season, 2012);
		assert.strictEqual(pf.stats[0].abbrev, "CIN");
		assert.strictEqual(pf.stats[0].fg, 20);
		assert.strictEqual(pf.stats.length, 1);
		assert.strictEqual(pf.careerStats.fg, 20);
		assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
	});

	test("mergeStats combines stats from multiple teams in the same season", async () => {
		const p2 = helpers.deepCopy(p);
		p2.stats[1].playoffs = false;
		p2.stats[1].tid = 20;

		const pf = await idb.getCopy.playersPlus(p2, {
			attrs: ["tid"],
			stats: ["season", "fg", "tid"],
			season: 2012,
			mergeStats: true,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.stats.tid, 20);
		assert.strictEqual(pf.stats.fg, (30 + 20) / 8);
	});

	test("mergeStats combines stats from multiple teams in the same season, for multiple seasons", async () => {
		const p2 = helpers.deepCopy(p);
		p2.stats[1].playoffs = false;
		p2.stats[1].tid = 20;

		const pf = await idb.getCopy.playersPlus(p2, {
			attrs: ["tid"],
			stats: ["season", "fg", "tid"],
			mergeStats: true,
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		assert.strictEqual(pf.stats.length, 2);
		assert.strictEqual(pf.stats[0].tid, 20);
		assert.strictEqual(pf.stats[0].fg, (30 + 20) / 8);
		assert.strictEqual(pf.stats[1].fg, 56 / 8);
	});
});
