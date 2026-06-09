import { afterEach, assert, test } from "vitest";
import { PLAYER, RATINGS } from "../../../common/constants.ts";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { draft } from "../index.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import genPlayersWithoutSaving, {
	scaleProspectRatings,
} from "./genPlayersWithoutSaving.ts";

const setup = async () => {
	resetG();
	await resetCache();
	idb.league = mockIDBLeague();
};

const meanRating = (
	players: Awaited<ReturnType<typeof genPlayersWithoutSaving>>,
	key: "ovr" | "pot",
) => players.reduce((sum, p) => sum + p.ratings[0][key], 0) / players.length;

afterEach(() => {
	// @ts-expect-error
	idb.league = undefined;
});

test("generate 70 players for the draft", async () => {
	await setup();
	await draft.genPlayers(g.get("season"), DEFAULT_LEVEL);
	const players = await idb.cache.players.indexGetAll(
		"playersByDraftYearRetiredYear",
		[[g.get("season")], [g.get("season"), Infinity]],
	);
	assert.strictEqual(players.length, 70); // 70 players in a draft class

	for (const p of players) {
		assert.strictEqual(p.tid, PLAYER.UNDRAFTED);
	}
});

test("draft prospect quality factor neutral value leaves ratings unchanged", async () => {
	await setup();
	const players = await genPlayersWithoutSaving(
		g.get("season"),
		DEFAULT_LEVEL,
		[],
	);
	const before = helpers.deepCopy(players);

	await scaleProspectRatings(players, 1);

	assert.deepStrictEqual(players, before);
});

test("draft prospect quality factor increases prospect quality", async () => {
	await setup();
	const neutralPlayers = await genPlayersWithoutSaving(
		g.get("season"),
		DEFAULT_LEVEL,
		[],
	);
	const boostedPlayers = helpers.deepCopy(neutralPlayers);

	await scaleProspectRatings(boostedPlayers, 2);

	assert.isAbove(
		meanRating(boostedPlayers, "ovr"),
		meanRating(neutralPlayers, "ovr") + 10,
	);
	assert.isAbove(
		meanRating(boostedPlayers, "pot"),
		meanRating(neutralPlayers, "pot") + 10,
	);
});

test("draft prospect quality factor clamps ratings", async () => {
	await setup();
	const players = await genPlayersWithoutSaving(
		g.get("season"),
		DEFAULT_LEVEL,
		[],
	);

	await scaleProspectRatings(players, 1000);

	for (const p of players) {
		const ratings = p.ratings[0] as any;

		for (const key of RATINGS) {
			assert.isAtLeast(ratings[key], 0);
			assert.isAtMost(ratings[key], 100);
		}
		assert.isAtLeast(ratings.ovr, 0);
		assert.isAtMost(ratings.ovr, 100);
		assert.isAtLeast(ratings.pot, 0);
		assert.isAtMost(ratings.pot, 100);
	}
});

test("draft prospect quality factor applies during draft player generation", async () => {
	await setup();
	g.setWithoutSavingToDB("draftProspectQualityFactor", 0);

	const players = await genPlayersWithoutSaving(
		g.get("season"),
		DEFAULT_LEVEL,
		[],
	);

	for (const p of players) {
		const ratings = p.ratings[0] as any;

		for (const key of RATINGS) {
			assert.strictEqual(ratings[key], 0);
		}
	}
});
