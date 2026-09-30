import { assert, beforeAll, describe, test } from "vitest";
import { assert as typeAssert, type IsExact } from "conditional-type-checks";
import { PLAYER } from "../../../common/constants.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { player } from "../../core/index.ts";
import { idb } from "../index.ts";
import { g, helpers } from "../../util/index.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { last } from "../../../common/utils.ts";
import type {
	Player,
	NonEmptyArray,
	PlayerFiltered,
	PlayerSeasonType,
	PlayerStatMax,
} from "../../../common/types.ts";

let p: Player;
beforeAll(async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2011);
	p = {
		pid: 0,
		...player.generate(PLAYER.UNDRAFTED, 19, 2011, false, DEFAULT_LEVEL),
	};
	p.tid = 4;
	g.setWithoutSavingToDB("season", 2012);
	await resetCache({
		players: [p],
	});
	p.contract.exp = g.get("season") + 1;
	player.addStatsRow(p, g.get("season"), false);
	player.addStatsRow(p, g.get("season"), true);
	player.addStatsRow(p, g.get("season"), false);
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

	player.addRatingsRow(p);
	await player.develop(p, 0);

	player.addRatingsRow(p);
	assert(p.ratings[2]);
	p.ratings[2].season = 2013;
	await player.develop(p, 0);

	player.addRatingsRow(p);
	assert(p.ratings[3]);
	p.ratings[3].season = 2014;
	await player.develop(p, 0);
});

test("return requested info if tid/season match", async () => {
	const pf = await idb.getCopy.playersPlus(p, {
		attrs: ["tid", "awards"],
		ratings: ["season", "ovr"],
		stats: ["season", "tid", "fg", "fgp", "per"],
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
	assert.strictEqual(pf.stats.tid, 4);
	assert.strictEqual(typeof pf.stats.fg, "number");
	assert.strictEqual(typeof pf.stats.fgp, "number");
	assert.strictEqual(typeof pf.stats.per, "number");
	assert.strictEqual(Object.keys(pf.stats).length, 6);
	assert(!Object.hasOwn(pf, "careerStats"));
	assert(!Object.hasOwn(pf, "careerStatsPlayoffs"));
});

test("return requested info if tid/season match for an array of player objects", async () => {
	const pfs = await idb.getCopies.playersPlus([p, p], {
		attrs: ["tid", "awards"],
		ratings: ["season", "ovr"],
		stats: ["season", "tid", "fg", "fgp", "per"],
		tid: 4,
		season: 2012,
	});

	assert.strictEqual(pfs.length, 2);

	for (const pf of pfs) {
		assert.strictEqual(pf.tid, 4);
		assert.strictEqual(pf.awards.length, 0);
		assert.strictEqual(pf.ratings.season, 2012);
		assert.strictEqual(typeof pf.ratings.ovr, "number");
		assert.strictEqual(Object.keys(pf.ratings).length, 2);
		assert.strictEqual(pf.stats.season, 2012);
		assert.strictEqual(pf.stats.tid, 4);
		assert.strictEqual(typeof pf.stats.fg, "number");
		assert.strictEqual(typeof pf.stats.fgp, "number");
		assert.strictEqual(typeof pf.stats.per, "number");
		assert.strictEqual(Object.keys(pf.stats).length, 6);
		assert(!Object.hasOwn(pf, "careerStats"));
		assert(!Object.hasOwn(pf, "careerStatsPlayoffs"));
	}
});

test("return requested info if tid/season match, even when no attrs requested", async () => {
	const pf = await idb.getCopy.playersPlus(p, {
		ratings: ["season", "ovr"],
		stats: ["season", "tid", "fg", "fgp", "per"],
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
	assert.strictEqual(pf.stats.tid, 4);
	assert.strictEqual(typeof pf.stats.fg, "number");
	assert.strictEqual(typeof pf.stats.fgp, "number");
	assert.strictEqual(typeof pf.stats.per, "number");
	assert.strictEqual(Object.keys(pf.stats).length, 6);
	assert(!Object.hasOwn(pf, "careerStats"));
	assert(!Object.hasOwn(pf, "careerStatsPlayoffs"));
});

test("return requested info if tid/season match, even when no ratings requested", async () => {
	const pf = await idb.getCopy.playersPlus(p, {
		attrs: ["tid", "awards"],
		stats: ["season", "tid", "fg", "fgp", "per"],
		tid: 4,
		season: 2012,
	});

	if (!pf) {
		throw new Error("Missing player");
	}

	assert.strictEqual(pf.tid, 4);
	assert.strictEqual(pf.awards.length, 0);
	assert(!Object.hasOwn(pf, "ratings"));
	assert.strictEqual(pf.stats.season, 2012);
	assert.strictEqual(pf.stats.tid, 4);
	assert.strictEqual(typeof pf.stats.fg, "number");
	assert.strictEqual(typeof pf.stats.fgp, "number");
	assert.strictEqual(typeof pf.stats.per, "number");
	assert.strictEqual(Object.keys(pf.stats).length, 6);
	assert(!Object.hasOwn(pf, "careerStats"));
	assert(!Object.hasOwn(pf, "careerStatsPlayoffs"));
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
	assert(!Object.hasOwn(pf, "stats"));
	assert(!Object.hasOwn(pf, "careerStats"));
	assert(!Object.hasOwn(pf, "careerStatsPlayoffs"));
});

test("return undefined if tid does not match any on record", async () => {
	const pf = await idb.getCopy.playersPlus(p, {
		attrs: ["tid", "awards"],
		ratings: ["season", "ovr"],
		stats: ["season", "tid", "fg", "fgp", "per"],
		tid: 5,
		season: 2012,
	});
	assert.strictEqual(pf, undefined);
});

test("return undefined if season does not match any on record", async () => {
	const pf = await idb.getCopy.playersPlus(p, {
		attrs: ["tid", "awards"],
		ratings: ["season", "ovr"],
		stats: ["season", "abbrev", "fg", "fgp", "per"],
		tid: 4,
		season: 2014,
	});
	assert.strictEqual(pf, undefined);
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

test("return regular season and playoff stats if options.seasonType includes both", async () => {
	const pf = await idb.getCopy.playersPlus(p, {
		stats: ["gp", "fg"],
		tid: 4,
		season: 2012,
		seasonType: ["regularSeason", "playoffs"],
	});

	if (!pf) {
		throw new Error("Missing player");
	}

	assert.strictEqual(pf.stats.length, 2);
	assert(pf.stats[0]);
	assert(pf.stats[1]);
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
	assert.strictEqual(pf, undefined);
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

	assert(p.ratings[1]);

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
	assert.strictEqual(pf, undefined);
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
		stats: ["season", "tid", "fg"],
		statType: "totals",
	});

	if (!pf) {
		throw new Error("Missing player");
	}

	assert(pf.ratings[0]);
	assert(pf.ratings[1]);
	assert(pf.ratings[2]);
	assert(pf.stats[0]);
	assert(pf.stats[1]);
	assert.strictEqual(pf.tid, 4);
	assert.strictEqual(pf.awards.length, 0);
	assert.strictEqual(pf.ratings[0].season, 2011);
	assert.strictEqual(typeof pf.ratings[0].ovr, "number");
	assert.strictEqual(pf.ratings[1].season, 2012);
	assert.strictEqual(typeof pf.ratings[1].ovr, "number");
	assert.strictEqual(pf.ratings[2].season, 2013);
	assert.strictEqual(typeof pf.ratings[2].ovr, "number");
	assert.strictEqual(pf.stats[0].season, 2012);
	assert.strictEqual(pf.stats[0].tid, 4);
	assert.strictEqual(pf.stats[0].fg, 20);
	assert.strictEqual(pf.stats[1].season, 2013);
	assert.strictEqual(pf.stats[1].tid, 0);
	assert.strictEqual(pf.stats[1].fg, 56);
	assert.strictEqual(pf.careerStats.fg, 76);
	assert(!Object.hasOwn(pf, "careerStatsPlayoffs"));
});

test("return stats and ratings from all seasons with a specific team if no season is specified but a team is", async () => {
	const pf = await idb.getCopy.playersPlus(p, {
		attrs: ["tid", "awards"],
		ratings: ["season", "ovr"],
		stats: ["season", "tid", "fg"],
		tid: 4,
		statType: "totals",
	});

	if (!pf) {
		throw new Error("Missing player");
	}

	assert(pf.ratings[0]);
	assert(pf.stats[0]);
	assert.strictEqual(pf.tid, 4);
	assert.strictEqual(pf.awards.length, 0);
	assert.strictEqual(pf.ratings[0].season, 2012);
	assert.strictEqual(typeof pf.ratings[0].ovr, "number");
	assert.strictEqual(pf.ratings.length, 1);
	assert.strictEqual(pf.stats[0].season, 2012);
	assert.strictEqual(pf.stats[0].tid, 4);
	assert.strictEqual(pf.stats[0].fg, 20);
	assert.strictEqual(pf.stats.length, 1);
	assert.strictEqual(pf.careerStats.fg, 20);
	assert(!Object.hasOwn(pf, "careerStatsPlayoffs"));
});

test("mergeStats combines stats from multiple teams in the same season", async () => {
	const p2 = helpers.deepCopy(p);
	p2.stats[1].playoffs = false;
	p2.stats[1].tid = 20;

	const pf = await idb.getCopy.playersPlus(p2, {
		attrs: ["tid"],
		stats: ["season", "fg", "tid"],
		season: 2012,
		mergeStats: "totOnly",
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
		mergeStats: "totOnly",
	});

	if (!pf) {
		throw new Error("Missing player");
	}

	assert.strictEqual(pf.stats.length, 2);
	assert(pf.stats[0]);
	assert(pf.stats[1]);
	assert.strictEqual(pf.stats[0].tid, 20);
	assert.strictEqual(pf.stats[0].fg, (30 + 20) / 8);
	assert.strictEqual(pf.stats[1].fg, 56 / 8);
});

test("mergeStats totAndTeams results ", async () => {
	const p2 = helpers.deepCopy(p);
	p2.stats[1].playoffs = false;
	p2.stats[1].tid = 20;

	const pf = await idb.getCopy.playersPlus(p2, {
		attrs: ["tid"],
		stats: ["season", "fg", "tid"],
		ratings: ["season", "tid"],
		mergeStats: "totAndTeams",
	});

	if (!pf) {
		throw new Error("Missing player");
	}

	assert.strictEqual(pf.stats.length, 4);
	assert(pf.stats[0]);
	assert(pf.stats[1]);
	assert(pf.stats[2]);
	assert(pf.stats[3]);

	assert.strictEqual(pf.stats[0].tid, 4);
	assert.strictEqual(pf.stats[1].tid, 20);
	assert.strictEqual(pf.stats[2].tid, PLAYER.TOT);
	assert.strictEqual(pf.stats[3].tid, 0);

	assert.strictEqual(pf.stats[0].season, 2012);
	assert.strictEqual(pf.stats[1].season, 2012);
	assert.strictEqual(pf.stats[2].season, 2012);
	assert.strictEqual(pf.stats[3].season, 2013);

	assert.strictEqual(pf.stats[0].fg, 20 / 5);
	assert.strictEqual(pf.stats[1].fg, 30 / 3);
	assert.strictEqual(pf.stats[2].fg, 50 / 8);
	assert.strictEqual(pf.stats[3].fg, 56 / 8);

	assert.strictEqual(pf.stats[0].hasTot, true);
	assert.strictEqual(pf.stats[1].hasTot, true);
	assert.strictEqual(pf.stats[2].hasTot, undefined);
	assert.strictEqual(pf.stats[3].hasTot, undefined);

	assert.deepStrictEqual(pf.ratings, [
		{
			season: 2011,
			tid: undefined,
		},
		{
			season: 2012,
			tid: 20,
		},
		{
			season: 2013,
			tid: 0,
		},
		{
			season: 2014,
			tid: undefined,
		},
	]);
});

test("mergeStats totOnly when first row has >0 GP and second has 0 GP", async () => {
	const p2 = helpers.deepCopy(p);
	p2.stats[1].playoffs = false;
	p2.stats[1].tid = 20;
	p2.stats[1].gp = 0;
	p2.stats[1].fg = 0;

	const pf = await idb.getCopy.playersPlus(p2, {
		stats: ["gp", "tid"],
		season: p2.stats[1].season,
		mergeStats: "totOnly",
	});

	if (!pf) {
		throw new Error("Missing player");
	}

	// There was a bug where this returned 0, even though it should be 5 GP from the first season
	assert.strictEqual(pf.stats.gp, 5);
	assert.strictEqual(pf.stats.tid, 4);
});

test("careerStats works when player has no stats rows", async () => {
	const p = {
		pid: 0,
		...player.generate(PLAYER.UNDRAFTED, 19, 2011, false, DEFAULT_LEVEL),
	};
	const pf = await idb.getCopy.playersPlus(p, {
		stats: ["gp", "playoffs", "bpm"],
	});

	// Why is playoffs undefined? Ultimately comes from `row.playoffs = ps.playoffs;` - we don't know what to set the default value (true/false/"combined") if it does not exist. Might be better to just not have playoffs in career stats since it is implied from the property name (like careerStatsPlayoffs)
	assert.deepStrictEqual(pf, {
		stats: [],
		careerStats: { gp: 0, playoffs: undefined, bpm: 0 },
	});
});

describe("TypeScript", () => {
	test("Returns attrs, ratings, and stats as objects for a single season", async () => {
		const players = await idb.getCopies.playersPlus([p], {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "tid", "fg", "fgp", "per"],
			tid: 4,
			season: 2012,
		});

		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			ratings: ["season", "ovr"],
			stats: ["season", "tid", "fg", "fgp", "per"],
			tid: 4,
			season: 2012,
		});

		typeAssert<
			IsExact<(typeof players)[number], Exclude<typeof pf, undefined>>
		>(true);

		typeAssert<
			IsExact<
				(typeof players)[number],
				{
					tid: number;
					awards: Player["awards"];
					ratings: {
						season: number;
						ovr: number;
					};
					stats: {
						season: number;
						tid: number;
						fg: number;
						fgp: number;
						per: number;
						playoffs: boolean;
						hasTot?: true;
					};
				}
			>
		>(true);
	});

	test("Returns just attrs", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid", "awards"],
			season: 2012,
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				{
					tid: number;
					awards: Player["awards"];
				}
			>
		>(true);
	});

	test("Returns arrays and careerStats when no season is supplied", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["tid"],
			ratings: ["season", "ovr"],
			stats: ["season", "fg"],
		});

		type StatsRow = {
			season: number;
			fg: number;
			playoffs: boolean;
			hasTot?: true;
		};

		type CareerStatsRow = {
			season: number;
			fg: number;
			playoffs: number | undefined;
			hasTot?: true;
		};

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				{
					tid: number;
					ratings: NonEmptyArray<{
						season: number;
						ovr: number;
					}>;
					stats: StatsRow[];
					careerStats: CareerStatsRow;
				}
			>
		>(true);
	});

	test("Returns stats array and no careerStats for a single season with both playoffs and regular season", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp", "fg"],
			tid: 4,
			season: 2012,
			seasonType: ["regularSeason", "playoffs"],
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				{
					stats: {
						gp: number;
						fg: number;
						playoffs: boolean;
						hasTot?: true;
					}[];
				}
			>
		>(true);
	});

	test("Returns stats object for a single season with only playoffs", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp"],
			season: 2012,
			seasonType: "playoffs",
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				{
					stats: {
						gp: number;
						playoffs: boolean;
						hasTot?: true;
					};
				}
			>
		>(true);
	});

	test("Returns careerStats and careerStatsPlayoffs when no season is supplied and seasonType includes regular season and playoffs", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp"],
			seasonType: ["regularSeason", "playoffs"],
		});

		type StatsRow = {
			gp: number;
			playoffs: boolean;
			hasTot?: true;
		};

		type CareerStatsRow = {
			gp: number;
			playoffs: number | undefined;
			hasTot?: true;
		};

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				{
					stats: StatsRow[];
					careerStats: CareerStatsRow;
					careerStatsPlayoffs: CareerStatsRow;
				}
			>
		>(true);
	});

	test("Returns object or array, and optional careerStats, when season and seasonType are not known statically", async () => {
		// Functions rather than constants, otherwise TypeScript narrows the types
		const getSeason = (): number | undefined => 2012;
		const getSeasonType = (): PlayerSeasonType => "regularSeason";
		const pf = await idb.getCopy.playersPlus(p, {
			ratings: ["ovr"],
			stats: ["gp"],
			season: getSeason(),
			seasonType: getSeasonType(),
		});

		type StatsRow = {
			gp: number;
			playoffs: boolean | "combined";
			hasTot?: true;
		};

		type CareerStatsRow<PlayoffsValue> = {
			gp: number;
			playoffs: PlayoffsValue | undefined;
			hasTot?: true;
		};

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["ratings"],
				{ ovr: number } | NonEmptyArray<{ ovr: number }>
			>
		>(true);
		typeAssert<
			IsExact<Exclude<typeof pf, undefined>["stats"], StatsRow | StatsRow[]>
		>(true);
		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["careerStats"],
				CareerStatsRow<number> | undefined
			>
		>(true);
		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["careerStatsPlayoffs"],
				CareerStatsRow<number> | undefined
			>
		>(true);
		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["careerStatsCombined"],
				CareerStatsRow<string> | undefined
			>
		>(true);
	});

	test("Returns stats object for a single season when seasonType is a single value not known statically", async () => {
		const getSeasonType = (): PlayerSeasonType => "regularSeason";
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp"],
			season: 2012,
			seasonType: getSeasonType(),
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["stats"],
				{
					gp: number;
					playoffs: boolean | "combined";
					hasTot?: true;
				}
			>
		>(true);
	});

	test("Returns stats array for a single season when seasonType is an array, even with one value", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp"],
			tid: 4,
			season: 2012,
			seasonType: ["regularSeason"],
		});

		assert(Array.isArray(pf?.stats));

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["stats"],
				{
					gp: number;
					playoffs: boolean;
					hasTot?: true;
				}[]
			>
		>(true);
	});

	test("Derived and overridden attrs have the correct types", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["name", "age", "hof", "diedYear", "note", "untradable"],
			season: 2012,
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				{
					name: string;
					age: number;
					hof: boolean;
					diedYear: number | null;
					note: string | undefined;
					untradable: boolean;
					untradableMsg?: string;
				}
			>
		>(true);
	});

	test("Stats from different sports have the correct types", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["keyStats", "a", "ptsMax", "abbrev", "jerseyNumber"],
			tid: 4,
			season: 2012,
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["stats"],
				{
					// String in baseball/football/hockey
					keyStats: string;

					// Array in baseball (byPos), number in hockey
					a: number | (number | undefined)[];

					ptsMax: PlayerStatMax;
					abbrev: string;
					jerseyNumber: string | undefined;
					playoffs: boolean;
					hasTot?: true;
				}
			>
		>(true);
	});

	test("Invalid attrs, ratings, and stats are errors", () => {
		// Not called, just type checked
		const f = async () => {
			await idb.getCopy.playersPlus(p, {
				// @ts-expect-error
				attrs: ["notAnAttr"],
			});
			await idb.getCopy.playersPlus(p, {
				// @ts-expect-error
				ratings: ["notARating"],
			});
			await idb.getCopy.playersPlus(p, {
				// @ts-expect-error
				stats: ["notAStat"],
			});
		};
		assert.strictEqual(typeof f, "function");
	});

	test("contract.exp may be undefined with seasonRange and no season", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["contract"],
			seasonRange: [2011, 2012],
		});
		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>["contract"]["exp"],
				number | undefined
			>
		>(true);

		const pf2 = await idb.getCopy.playersPlus(p, {
			attrs: ["contract"],
			season: 2012,
			seasonRange: [2011, 2012],
		});
		typeAssert<
			IsExact<Exclude<typeof pf2, undefined>["contract"]["exp"], number>
		>(true);
	});

	test("Single season stats may be undefined with showRookies unless showNoStats is also set", async () => {
		type StatsRow = {
			gp: number;
			playoffs: boolean;
			hasTot?: true;
		};

		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp"],
			season: 2012,
			showRookies: true,
		});
		typeAssert<
			IsExact<Exclude<typeof pf, undefined>["stats"], StatsRow | undefined>
		>(true);

		// showNoStats adds an empty row, which has no playoffs value
		const pf2 = await idb.getCopy.playersPlus(p, {
			stats: ["gp"],
			season: 2012,
			showRookies: true,
			showNoStats: true,
		});
		typeAssert<
			IsExact<
				Exclude<typeof pf2, undefined>["stats"],
				{
					gp: number;
					playoffs: boolean | undefined;
					hasTot?: true;
				}
			>
		>(true);
	});

	test("combined stats", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			stats: ["gp"],
			seasonType: ["regularSeason", "combined"],
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				{
					stats: {
						gp: number;
						playoffs: boolean | "combined";
						hasTot?: true;
					}[];
					careerStats: {
						gp: number;
						playoffs: number | undefined;
						hasTot?: true;
					};
					careerStatsCombined: {
						gp: number;
						playoffs: string | undefined;
						hasTot?: true;
					};
				}
			>
		>(true);
	});

	test("PlayerFiltered matches playersPlus output", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["pid", "name"],
			ratings: ["ovr"],
			stats: ["gp"],
			season: 2012,
		});

		typeAssert<
			IsExact<
				Exclude<typeof pf, undefined>,
				PlayerFiltered<{
					attrs: ["pid", "name"];
					ratings: ["ovr"];
					stats: ["gp"];
					season: number;
				}>
			>
		>(true);
	});

	test("Ratings array is never empty, so the last row is always defined", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			ratings: ["season", "ovr"],
		});

		if (!pf) {
			throw new Error("Missing player");
		}

		const lastRatings = last(pf.ratings);
		typeAssert<IsExact<typeof lastRatings, { season: number; ovr: number }>>(
			true,
		);
	});

	test("Empty ratings array is the same as not requesting ratings", async () => {
		const pf = await idb.getCopy.playersPlus(p, {
			attrs: ["pid"],
			ratings: [],
			season: 2012,
		});

		assert(pf);
		assert(!Object.hasOwn(pf, "ratings"));

		typeAssert<IsExact<Exclude<typeof pf, undefined>, { pid: number }>>(true);
	});
});
