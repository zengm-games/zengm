import { assert, beforeAll, test } from "vitest";
import GameSim from "./index.ts";
import getInjuryRate from "../GameSim/getInjuryRate.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import writePlayerStats from "../game/writePlayerStats.ts";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { range } from "../../../common/utils.ts";
import { idb } from "../../db/index.ts";

const genTwoTeams = async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2013);
	const teamsDefault = helpers.getTeamsDefault().slice(0, 2);
	const players = [
		...range(12).map(() => player.generate(0, 25, 2010, true, DEFAULT_LEVEL)),
		...range(12).map(() => player.generate(1, 25, 2010, true, DEFAULT_LEVEL)),
	];
	players[0]!.injuryImmune = true;
	players[0]!.injury = {
		type: "Sprained Ankle",
		gamesRemaining: 5,
	};

	await resetCache({
		players,
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
		teamStats: teamsDefault.map((t) => team.genStatsRow(t.tid)),
	});
};

beforeAll(async () => {
	await genTwoTeams();
});

test("getInjuryRate returns 0 when injuryImmune is true", () => {
	assert.isAbove(getInjuryRate(0.01, 35, true, false), 0);
	assert.strictEqual(getInjuryRate(0.01, 35, true, true), 0);
});

test("basketball injuryImmune players stay healthy in loadTeams, GameSim.injuries, and writePlayerStats", async () => {
	const teams = await loadTeams([0, 1], {});
	const immuneLoaded = teams[0]!.player.find((p: any) => p.injuryImmune);
	assert.isDefined(immuneLoaded);
	assert.strictEqual(immuneLoaded.injured, false);
	assert.deepStrictEqual(immuneLoaded.injury, {
		type: "Healthy",
		gamesRemaining: 0,
		playingThrough: false,
	});

	const game = new GameSim({
		gid: 0,
		teams: [teams[0]!, teams[1]!],
		baseInjuryRate: 100,
		doPlayByPlay: false,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: false,
	});

	const immunePlayer = game.playersOnCourt[0].find((p) => p.injuryImmune);
	assert.isDefined(immunePlayer);
	const nonImmuneOnCourt = game.playersOnCourt[0].filter(
		(p) => !p.injuryImmune,
	);
	assert.isAbove(nonImmuneOnCourt.length, 0);

	game.injuries();

	assert.strictEqual(immunePlayer.injured, false);
	assert.notOk(immunePlayer.newInjury);
	for (const p of nonImmuneOnCourt) {
		assert.strictEqual(p.injured, true);
		assert.strictEqual(p.newInjury, true);
	}

	const dbImmune = await idb.cache.players.get(immunePlayer.id);
	assert.isDefined(dbImmune);
	dbImmune.injury = { type: "Healthy", gamesRemaining: 0 };
	await idb.cache.players.put(dbImmune);

	const freshTeams = await loadTeams([0, 1], {});
	const resultGame = new GameSim({
		gid: 1,
		teams: [freshTeams[0]!, freshTeams[1]!],
		baseInjuryRate: 0,
		doPlayByPlay: false,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: false,
	});
	const result = resultGame.run();
	const immuneResultPlayer = result.team[0].player.find(
		(p: any) => p.id === immunePlayer.id,
	);
	assert.isDefined(immuneResultPlayer);
	immuneResultPlayer.newInjury = true;

	await writePlayerStats([result as any], {});

	const savedImmune = await idb.cache.players.get(immunePlayer.id);
	assert.isDefined(savedImmune);
	assert.strictEqual(savedImmune.injury.type, "Healthy");
	assert.strictEqual(savedImmune.injury.gamesRemaining, 0);
	assert.strictEqual(savedImmune.injuries.length, 0);
});
