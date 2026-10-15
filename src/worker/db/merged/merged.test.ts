import * as fakeIndexedDB from "fake-indexeddb";
import {
	afterAll,
	assert,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "vitest";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { PLAYER } from "../../../common/constants.ts";
import type {
	AllStars,
	EventBBGM,
	Game,
	Message,
	Player,
	TeamSeason,
	TeamStats,
} from "../../../common/types.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { player, team } from "../../core/index.ts";
import { g } from "../../util/index.ts";
import Cache, { STORES } from "../Cache.ts";
import { connectLeague, idb } from "../index.ts";

const SEASON = 2016;

const makePlayer = (pid: number, overrides: Partial<Player> = {}): Player => {
	const p = player.generate(0, 25, SEASON - 3, true, DEFAULT_LEVEL);
	return {
		...p,
		pid,
		...overrides,
	};
};

const makeMessage = (mid: number): Message => {
	return {
		mid,
		from: "The Owner",
		read: false,
		text: `Message ${mid}`,
		year: SEASON,
	};
};

const makeGame = (gid: number, season: number): Game => {
	return {
		att: 0,
		gid,
		lost: { tid: 1, pts: 0 },
		overtimes: 0,
		season,
		teams: [
			{ tid: 0, players: [], pts: 1 },
			{ tid: 1, players: [], pts: 0 },
		],
		won: { tid: 0, pts: 1 },
	};
};

const makeAllStars = (season: number): AllStars => {
	return {
		season,
		teamNames: ["", ""],
		teams: [[], []],
		remaining: [],
		finalized: true,
		type: "draft",
	};
};

const makeTeamSeason = (
	rid: number,
	tid: number,
	season: number,
): TeamSeason => {
	const t = team.generate({
		tid,
		cid: 0,
		did: 0,
		region: "Region",
		name: "Name",
		abbrev: "ABC",
		pop: 1,
	});
	return {
		...team.genSeasonRow(t),
		rid,
		season,
	};
};

const makeTeamStats = (
	rid: number,
	tid: number,
	season: number,
	playoffs = false,
): TeamStats => {
	return {
		...team.genStatsRow(tid, playoffs),
		rid,
		season,
	};
};

const makeEvent = (
	eid: number,
	season: number,
	text = `Event ${eid}`,
): EventBBGM => {
	return {
		eid,
		type: "injured",
		text,
		season,
	};
};

const pids = (players: Player[]) => players.map((p) => p.pid).sort();

// The idb library needs these to exist globally. IDBKeyRange is not here because it's already set globally in all tests.
const IDB_GLOBALS = [
	"IDBCursor",
	"IDBCursorWithValue",
	"IDBDatabase",
	"IDBIndex",
	"IDBObjectStore",
	"IDBOpenDBRequest",
	"IDBRequest",
	"IDBTransaction",
] as const;

beforeAll(async () => {
	for (const name of IDB_GLOBALS) {
		(globalThis as any)[name] = fakeIndexedDB[name];
	}
	globalThis.indexedDB = new fakeIndexedDB.IDBFactory();
	resetG();
	idb.league = await connectLeague(1);
});

afterAll(() => {
	idb.league.close();

	// @ts-expect-error
	idb.league = undefined;

	// @ts-expect-error
	delete globalThis.indexedDB;
	for (const name of IDB_GLOBALS) {
		delete (globalThis as any)[name];
	}
});

beforeEach(async () => {
	const tx = idb.league.transaction(STORES, "readwrite");
	for (const store of STORES) {
		await tx.objectStore(store).clear();
	}
	await tx.done;

	await resetCache({});
});

describe("get", () => {
	test("return row from IndexedDB", async () => {
		await idb.league.put("players", makePlayer(1));

		const p = await idb.merged.players.get(1);
		assert.strictEqual(p?.pid, 1);
	});

	test("return undefined when there is no row", async () => {
		assert.strictEqual(await idb.merged.players.get(1), undefined);
	});

	test("cache takes priority over IndexedDB", async () => {
		await idb.league.put("players", makePlayer(1, { firstName: "Old" }));
		const cached = makePlayer(1, { firstName: "New" });
		await idb.cache.players.put(cached);

		const p = await idb.merged.players.get(1);
		assert.strictEqual(p, cached);
	});

	test("don't return a row that was deleted from the cache but is still in IndexedDB", async () => {
		await idb.league.put("players", makePlayer(1));
		await idb.cache.players.delete(1);

		assert.strictEqual(await idb.merged.players.get(1), undefined);
	});

	test("works for a store with no custom selectors", async () => {
		await idb.league.put("playoffSeries", {
			season: SEASON - 1,
			currentRound: 0,
			series: [],
		});
		await idb.cache.playoffSeries.put({
			season: SEASON,
			currentRound: 1,
			series: [],
		});

		const old = await idb.merged.playoffSeries.get(SEASON - 1);
		assert.strictEqual(old?.currentRound, 0);
		const current = await idb.merged.playoffSeries.get(SEASON);
		assert.strictEqual(current?.currentRound, 1);
	});

	test("current season is only read from the cache for stores with currentSeasonInCache", async () => {
		// Can't happen in a real league, but it shows that IndexedDB is not checked
		await idb.league.put("allStars", makeAllStars(SEASON));
		await idb.league.put("allStars", makeAllStars(SEASON - 1));

		assert.strictEqual(await idb.merged.allStars.get(SEASON), undefined);
		assert.strictEqual(
			(await idb.merged.allStars.get(SEASON - 1))?.season,
			SEASON - 1,
		);
	});
});

describe("getAll", () => {
	test("merge rows from the cache and IndexedDB", async () => {
		await idb.league.put("players", makePlayer(1));
		await idb.league.put("players", makePlayer(2, { firstName: "Old" }));
		await idb.cache.players.put(makePlayer(2, { firstName: "New" }));
		await idb.cache.players.put(makePlayer(3));

		const players = await idb.merged.players.getAll();
		assert.deepStrictEqual(pids(players), [1, 2, 3]);
		assert.strictEqual(players.find((p) => p.pid === 2)?.firstName, "New");
	});

	test("don't return a row that was deleted from the cache but is still in IndexedDB", async () => {
		await idb.league.put("players", makePlayer(1, { hof: 1 }));
		await idb.league.put("players", makePlayer(2, { hof: 1 }));
		await idb.cache.players.delete(1);

		assert.deepStrictEqual(pids(await idb.merged.players.getAll()), [2]);
		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ hof: true })),
			[2],
		);
	});

	test("don't return a row that matches in IndexedDB but no longer matches in the cache", async () => {
		await idb.league.put("players", makePlayer(1, { hof: 1 }));
		await idb.league.put("players", makePlayer(2, { hof: 1 }));
		await idb.cache.players.put(makePlayer(2));

		const players = await idb.merged.players.getAll({ hof: true });
		assert.deepStrictEqual(pids(players), [1]);
	});

	test("return a row that matches in the cache but does not match in IndexedDB", async () => {
		await idb.league.put("players", makePlayer(1));
		await idb.cache.players.put(makePlayer(1, { hof: 1 }));

		const players = await idb.merged.players.getAll({ hof: true });
		assert.deepStrictEqual(pids(players), [1]);
	});

	test("filter and map apply to rows from the cache and IndexedDB", async () => {
		await idb.league.put("players", makePlayer(1, { lastName: "A" }));
		await idb.league.put("players", makePlayer(2, { lastName: "B" }));
		await idb.cache.players.put(makePlayer(3, { lastName: "A" }));
		await idb.cache.players.put(makePlayer(4, { lastName: "B" }));

		const output = await idb.merged.players.getAll(undefined, {
			filter: (p) => p.lastName === "A",
			map: (p) => p.pid,
		});
		assert.deepStrictEqual(output.sort(), [1, 3]);
	});

	test("rows from the cache are not copied", async () => {
		const cached = makePlayer(1);
		await idb.cache.players.put(cached);

		const players = await idb.merged.players.getAll();
		assert.strictEqual(players[0], cached);
	});

	test("works for a store with no custom selectors", async () => {
		await idb.league.put("playoffSeries", {
			season: SEASON - 1,
			currentRound: 0,
			series: [],
		});
		await idb.cache.playoffSeries.put({
			season: SEASON,
			currentRound: 1,
			series: [],
		});

		const seasons = await idb.merged.playoffSeries.getAll(undefined, {
			map: (row) => row.season,
		});
		assert.deepStrictEqual(seasons, [SEASON - 1, SEASON]);
	});
});

describe("players selectors", () => {
	test("pids returns rows in the requested order, skipping missing and deleted rows", async () => {
		for (const pid of [2, 4, 5, 8, 9, 20]) {
			await idb.league.put("players", makePlayer(pid, { firstName: "Old" }));
		}
		await idb.cache.players.put(makePlayer(5, { firstName: "New" }));
		await idb.cache.players.put(makePlayer(7, { firstName: "New" }));
		await idb.cache.players.delete(8);

		const players = await idb.merged.players.getAll({
			pids: [20, 1, 7, 3, 5, 8, 2, 10, 20, 30],
		});
		assert.deepStrictEqual(
			players.map((p) => p.pid),
			[20, 7, 5, 2, 20],
		);
		assert.deepStrictEqual(
			players.map((p) => p.firstName),
			["Old", "New", "New", "Old", "Old"],
		);

		assert.deepStrictEqual(await idb.merged.players.getAll({ pids: [] }), []);
		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ pids: [4] })),
			[4],
		);
	});

	test("tid only reads from the cache", async () => {
		await idb.league.put("players", makePlayer(1, { tid: 5 }));
		await idb.cache.players.put(makePlayer(2, { tid: 5 }));
		await idb.cache.players.put(makePlayer(3, { tid: 6 }));
		await idb.cache.players.put(makePlayer(4, { tid: 7 }));

		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ tid: 5 })),
			[2],
		);
		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ tid: [5, 6] })),
			[2, 3],
		);
	});

	// Random players, some only in IndexedDB, some only in the cache, and some in both with different values. Then every selector should return the same thing as filtering the merged players.
	test("selectors return the same players as filtering all players", async () => {
		const numPlayers = 300;
		const merged = new Map<number, Player>();

		const randInt = (min: number, max: number) =>
			min + Math.floor(Math.random() * (max - min + 1));

		const randomPlayer = (pid: number, retired: boolean) => {
			const draftYear = randInt(SEASON - 12, SEASON - 1);
			const p = makePlayer(pid, {
				tid: retired ? PLAYER.RETIRED : randInt(PLAYER.UNDRAFTED, 3),
				retiredYear: retired ? randInt(draftYear, SEASON) : Infinity,
				statsTids: [randInt(0, 3), randInt(0, 3)],
			});
			p.draft.year = draftYear;
			if (Math.random() < 0.3) {
				p.hof = 1;
			}
			if (Math.random() < 0.3) {
				p.noteBool = 1;
			}
			if (Math.random() < 0.3) {
				p.watch = 1;
			}
			return p;
		};

		const tx = idb.league.transaction("players", "readwrite");
		for (let pid = 0; pid < numPlayers; pid++) {
			// Only retired players are missing from the cache
			const inDb = Math.random() < 0.8;
			const retiredInDb = Math.random() < 0.7;
			const inCache = !inDb || !retiredInDb || Math.random() < 0.3;

			if (inDb) {
				const p = randomPlayer(pid, retiredInDb);
				merged.set(pid, p);
				await tx.store.put(p);
			}
			if (inCache) {
				const p = randomPlayer(pid, Math.random() < 0.5);
				merged.set(pid, p);
				await idb.cache.players.put(p);
			}
		}
		await tx.done;

		// Pending deletes
		for (const pid of [5, 50, 150, 250]) {
			merged.delete(pid);
			await idb.cache.players.delete(pid);
		}

		const expected = (matches: (p: Player) => boolean) => {
			return Array.from(merged.values())
				.filter(matches)
				.map((p) => p.pid)
				.sort();
		};

		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll()),
			expected(() => true),
		);

		for (const retiredYear of [SEASON - 12, SEASON - 5, SEASON, SEASON + 1]) {
			assert.deepStrictEqual(
				pids(await idb.merged.players.getAll({ retiredYear })),
				expected((p) => p.retiredYear === retiredYear),
				`retiredYear ${retiredYear}`,
			);
		}

		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ activeAndRetired: true })),
			expected((p) => p.tid !== PLAYER.UNDRAFTED),
		);

		for (const activeSeason of [SEASON - 12, SEASON - 5, SEASON]) {
			assert.deepStrictEqual(
				pids(await idb.merged.players.getAll({ activeSeason })),
				expected(
					(p) => p.draft.year < activeSeason && p.retiredYear >= activeSeason,
				),
				`activeSeason ${activeSeason}`,
			);
		}

		for (const draftYear of [SEASON - 12, SEASON - 5, SEASON - 1]) {
			assert.deepStrictEqual(
				pids(await idb.merged.players.getAll({ draftYear })),
				expected((p) => p.draft.year === draftYear),
				`draftYear ${draftYear}`,
			);
		}

		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ statsTid: 2 })),
			expected((p) => p.statsTids.includes(2)),
		);

		// With few seasons, only statsTid is applied
		assert.deepStrictEqual(
			pids(
				await idb.merged.players.getAll({
					activeSeason: SEASON - 5,
					statsTid: 2,
				}),
			),
			expected((p) => p.statsTids.includes(2)),
		);

		// With many seasons, both are applied
		g.setWithoutSavingToDB("startingSeason", SEASON - 1000);
		assert.deepStrictEqual(
			pids(
				await idb.merged.players.getAll({
					activeSeason: SEASON - 5,
					statsTid: 2,
				}),
			),
			expected(
				(p) =>
					p.draft.year < SEASON - 5 &&
					p.retiredYear >= SEASON - 5 &&
					p.statsTids.includes(2),
			),
		);
		g.setWithoutSavingToDB("startingSeason", SEASON);

		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ hof: true })),
			expected((p) => p.hof === 1),
		);
		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ note: true })),
			expected((p) => p.noteBool === 1),
		);
		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ watch: true })),
			expected((p) => p.watch !== undefined),
		);

		const allPids = Array.from({ length: numPlayers }, (_, pid) => pid);
		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ pids: allPids })),
			expected(() => true),
		);
		const somePids = allPids.filter(() => Math.random() < 0.2);
		assert.deepStrictEqual(
			pids(await idb.merged.players.getAll({ pids: somePids })),
			expected((p) => somePids.includes(p.pid)),
		);
	});
});

describe("messages", () => {
	test("limit returns the most recent messages from the cache and IndexedDB", async () => {
		for (let mid = 0; mid < 10; mid++) {
			await idb.league.put("messages", makeMessage(mid));
		}

		// One old message updated in the cache, one deleted, and two new ones
		await idb.cache.messages.put({ ...makeMessage(2), read: true });
		await idb.cache.messages.delete(8);
		await idb.cache.messages.put(makeMessage(10));
		await idb.cache.messages.put(makeMessage(11));

		const mids = (limit: number) => {
			return idb.merged.messages.getAll({ limit }, { map: (m) => m.mid });
		};

		assert.deepStrictEqual(await mids(1), [11]);
		assert.deepStrictEqual(await mids(4), [7, 9, 10, 11]);
		assert.deepStrictEqual(
			await mids(100),
			[0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11],
		);

		// With limit, filter is not allowed
		await expect(
			idb.merged.messages.getAll({ limit: 10 }, { filter: (m) => !m.read }),
		).rejects.toThrow("filter is not allowed with limit");
	});

	test("limit reads extra messages from IndexedDB to make up for ones deleted from the cache", async () => {
		for (let mid = 0; mid < 5; mid++) {
			await idb.league.put("messages", makeMessage(mid));
		}
		await idb.cache.messages.delete(4);

		assert.deepStrictEqual(
			await idb.merged.messages.getAll({ limit: 2 }, { map: (m) => m.mid }),
			[2, 3],
		);
	});
});

describe("games", () => {
	test("season only reads the current season from the cache", async () => {
		// Can't happen in a real league, because the cache has every game from the current season, but it shows that IndexedDB is not checked
		await idb.league.put("games", makeGame(0, SEASON));

		await idb.league.put("games", makeGame(1, SEASON - 1));
		await idb.cache.games.put(makeGame(2, SEASON));

		const gids = (season: number) => {
			return idb.merged.games.getAll({ season }, { map: (game) => game.gid });
		};
		assert.deepStrictEqual(await gids(SEASON), [2]);
		assert.deepStrictEqual(await gids(SEASON - 1), [1]);
	});
});

describe("events", () => {
	// Older than the seasons in the cache
	const OLD_SEASON = SEASON - 2;

	test("season merges the cache and IndexedDB", async () => {
		for (let eid = 0; eid < 6; eid++) {
			await idb.league.put(
				"events",
				makeEvent(eid, eid < 3 ? OLD_SEASON - 1 : OLD_SEASON),
			);
		}

		// One event updated in the cache, one moved to a different season in the cache, one deleted, and one new one
		await idb.cache.events.put(makeEvent(3, OLD_SEASON, "Updated"));
		await idb.cache.events.put(makeEvent(4, OLD_SEASON - 1));
		await idb.cache.events.delete(5);
		await idb.cache.events.put(makeEvent(6, OLD_SEASON));

		const events = await idb.merged.events.getAll({ season: OLD_SEASON });
		assert.deepStrictEqual(
			events.map((event) => [event.eid, event.text]),
			[
				[3, "Updated"],
				[6, "Event 6"],
			],
		);

		assert.deepStrictEqual(
			(await idb.merged.events.getAll({ season: OLD_SEASON - 1 })).map(
				(event) => event.eid,
			),
			[0, 1, 2, 4],
		);
	});

	test("current and previous season only read from the cache", async () => {
		// Can't happen in a real league, because the cache has every event from these seasons, but it shows that IndexedDB is not checked
		await idb.league.put("events", makeEvent(0, SEASON));
		await idb.league.put("events", makeEvent(1, SEASON - 1));
		await idb.league.put("events", makeEvent(2, OLD_SEASON));

		await idb.cache.events.put(makeEvent(3, SEASON));
		await idb.cache.events.put(makeEvent(4, SEASON - 1));

		const eids = (season: number) => {
			return idb.merged.events.getAll(
				{ season },
				{ map: (event) => event.eid },
			);
		};
		assert.deepStrictEqual(await eids(SEASON), [3]);
		assert.deepStrictEqual(await eids(SEASON - 1), [4]);
		assert.deepStrictEqual(await eids(OLD_SEASON), [2]);
	});

	test("cache is filled with the current and previous season", async () => {
		for (let season = SEASON - 3; season <= SEASON; season++) {
			await idb.league.put("events", makeEvent(season, season));
		}

		// The cache from resetCache doesn't really fill
		const cache = new Cache();
		await cache.fill(SEASON);

		assert.deepStrictEqual(
			(await cache.events.getAll()).map((event) => event.season),
			[SEASON - 1, SEASON],
		);
	});
});

describe("teamSeasons", () => {
	const rids = (teamSeasons: TeamSeason[]) => {
		return teamSeasons.map((ts) => ts.rid).sort();
	};

	beforeEach(async () => {
		// Like the real cache, only recent seasons are in the cache
		let rid = 0;
		for (let season = SEASON - 5; season <= SEASON; season++) {
			for (const tid of [0, 1]) {
				const ts = makeTeamSeason(rid, tid, season);
				await idb.league.put("teamSeasons", ts);
				if (season >= SEASON - 2) {
					await idb.cache.teamSeasons.put(makeTeamSeason(rid, tid, season));
				}
				rid += 1;
			}
		}
	});

	test("single team and season", async () => {
		const old = await idb.merged.teamSeasons.getAll({
			tid: 1,
			season: SEASON - 5,
		});
		assert.deepStrictEqual(rids(old), [1]);

		const current = await idb.merged.teamSeasons.getAll({
			tid: 1,
			season: SEASON,
		});
		assert.deepStrictEqual(rids(current), [11]);
		assert.strictEqual(current[0], await idb.cache.teamSeasons.get(11));
	});

	test("old season that was changed in the cache", async () => {
		const ts = makeTeamSeason(1, 1, SEASON - 5);
		ts.won = 82;
		await idb.cache.teamSeasons.put(ts);

		const teamSeasons = await idb.merged.teamSeasons.getAll({
			tid: 1,
			season: SEASON - 5,
		});
		assert.strictEqual(teamSeasons.length, 1);
		assert.strictEqual(teamSeasons[0]?.won, 82);
	});

	test("all teams in a season", async () => {
		assert.deepStrictEqual(
			rids(await idb.merged.teamSeasons.getAll({ season: SEASON - 5 })),
			[0, 1],
		);
		assert.deepStrictEqual(
			rids(await idb.merged.teamSeasons.getAll({ season: SEASON })),
			[10, 11],
		);
	});

	test("all seasons or a range of seasons for a team", async () => {
		assert.deepStrictEqual(
			rids(await idb.merged.teamSeasons.getAll({ tid: 0 })),
			[0, 10, 2, 4, 6, 8],
		);
		assert.deepStrictEqual(
			rids(
				await idb.merged.teamSeasons.getAll({
					tid: 0,
					seasons: [SEASON - 3, SEASON - 1],
				}),
			),
			[4, 6, 8],
		);
	});
});

describe("teamStats", () => {
	const rids = (rows: TeamStats[]) => {
		return rows.map((row) => row.rid).sort();
	};

	beforeEach(async () => {
		// Like the real cache, only the current season is in the cache
		let rid = 0;
		for (let season = SEASON - 2; season <= SEASON; season++) {
			for (const tid of [0, 1]) {
				for (const playoffs of [false, true]) {
					const row = makeTeamStats(rid, tid, season, playoffs);
					await idb.league.put("teamStats", row);
					if (season === SEASON) {
						await idb.cache.teamStats.put(
							makeTeamStats(rid, tid, season, playoffs),
						);
					}
					rid += 1;
				}
			}
		}
	});

	test("single team and season", async () => {
		assert.deepStrictEqual(
			rids(await idb.merged.teamStats.getAll({ tid: 1, season: SEASON - 2 })),
			[2, 3],
		);

		const current = await idb.merged.teamStats.getAll({
			tid: 1,
			season: SEASON,
		});
		assert.deepStrictEqual(rids(current), [10, 11]);
		assert.strictEqual(current[0], await idb.cache.teamStats.get(10));
	});

	test("current season only reads from the cache", async () => {
		// Can't happen in a real league, because the cache has every team stats row from the current season, but it shows that IndexedDB is not checked
		await idb.league.put("teamStats", makeTeamStats(100, 1, SEASON));

		assert.deepStrictEqual(
			rids(await idb.merged.teamStats.getAll({ tid: 1, season: SEASON })),
			[10, 11],
		);
	});

	test("all seasons for a team, including a new row only in the cache and a row deleted from the cache", async () => {
		await idb.cache.teamStats.put(makeTeamStats(100, 0, SEASON));
		await idb.cache.teamStats.delete(9);

		assert.deepStrictEqual(
			rids(await idb.merged.teamStats.getAll({ tid: 0 })),
			[0, 1, 100, 4, 5, 8],
		);
	});
});
