import assert from "assert";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player, team } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import { PlayerWithoutKey, MinimalPlayerRatings } from "../../../common/types";

describe("worker/core/team/checkRosterSizes", () => {
	beforeAll(() => {
		testHelpers.resetG(); // Two teams: user and AI

		g.setWithoutSavingToDB("numTeams", 2);
	});

	// resetCacheWithPlayers({0: 10, 1: 9, [PLAYER.FREE_AGENT]: 1}) will make 10 players on team 0, 9 on team 1, and	// 1 free agent with a minimum contract.

	const resetCacheWithPlayers = async (info: { [key: string]: number }) => {
		const players: PlayerWithoutKey<MinimalPlayerRatings>[] = [];

		for (const tidString of Object.keys(info)) {
			const tid = parseInt(tidString, 10);

			for (let i = 0; i < info[tidString]; i++) {
				const p = player.generate(tid, 30, 2017, true, 15.5);

				if (tid === PLAYER.FREE_AGENT) {
					p.contract.amount = g.get("minContract");
				}

				players.push(p);
			}
		}

		await testHelpers.resetCache({
			players,
		});
	};

	test("add players to AI team under roster limit without returning error message", async () => {
		await resetCacheWithPlayers({
			"0": 10,
			"1": 9,
			[PLAYER.FREE_AGENT]: 1,
		});

		// Confirm roster size under limit
		let players = await idb.cache.players.indexGetAll("playersByTid", 1);
		assert.equal(players.length, 9);
		const userTeamSizeError = await team.checkRosterSizes();
		assert.equal(userTeamSizeError, undefined); // Confirm players added up to limit

		players = await idb.cache.players.indexGetAll("playersByTid", 1);
		assert.equal(players.length, g.get("minRosterSize"));
	});

	test("return error message when AI team needs to add a player but there is none", async () => {
		await resetCacheWithPlayers({
			"0": 10,
			"1": 9,
		});

		// Confirm roster size under limit
		const teamSizeError = await team.checkRosterSizes();
		assert.equal(
			teamSizeError,
			"AI team BAL needs to add a player to meet the minimum roster requirements, but there are not enough free agents asking for a minimum salary. Easiest way to fix this is God Mode, give them extra players.",
		);
	});

	test("remove players to AI team over roster limit without returning error message", async () => {
		await resetCacheWithPlayers({
			"0": 10,
			"1": 24,
		});

		// Confirm roster size over limit
		let players = await idb.cache.players.indexGetAll("playersByTid", 1);
		assert.equal(players.length, 24); // Confirm no error message and roster size pruned to limit

		const userTeamSizeError = await team.checkRosterSizes();
		assert.equal(userTeamSizeError, undefined);
		players = await idb.cache.players.indexGetAll("playersByTid", 1);
		assert.equal(players.length, 15);
	});

	test("return error message when user team is under roster limit", async () => {
		await resetCacheWithPlayers({
			"0": 9,
			"1": 10,
			[PLAYER.FREE_AGENT]: 1,
		});

		// Confirm roster size under limit
		let players = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		assert.equal(players.length, 9); // Confirm roster size error and no auto-signing of players

		const userTeamSizeError = await team.checkRosterSizes();
		assert.equal(typeof userTeamSizeError, "string");
		if (userTeamSizeError) {
			assert(userTeamSizeError.includes("less"));
			assert(userTeamSizeError.includes("minimum"));
		}
		players = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		assert.equal(players.length, 9);
	});

	test("return error message when user team is over roster limit", async () => {
		await resetCacheWithPlayers({
			"0": 24,
			"1": 10,
		});

		// Confirm roster size over limit
		let players = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		assert.equal(players.length, 24); // Confirm roster size error and no auto-release of players

		const userTeamSizeError = await team.checkRosterSizes();
		assert.equal(typeof userTeamSizeError, "string");
		if (userTeamSizeError) {
			assert(userTeamSizeError.includes("more"));
			assert(userTeamSizeError.includes("maximum"));
		}
		players = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		assert.equal(players.length, 24);
	});
});
