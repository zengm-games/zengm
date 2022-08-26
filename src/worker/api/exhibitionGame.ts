import {
	DEFAULT_PLAY_THROUGH_INJURIES,
	DEFAULT_STADIUM_CAPACITY,
	EXHIBITION_GAME_SETTINGS,
	PHASE,
} from "../../common";
import type { Conditions } from "../../common/types";
import type {
	ExhibitionGameAttributes,
	ExhibitionTeam,
} from "../../ui/views/Exhibition";
import { GameSim } from "../core";
import { processTeam } from "../core/game/loadTeams";
import { gameSimToBoxScore } from "../core/game/writeGameStats";
import { connectLeague, idb } from "../db";
import { defaultGameAttributes, g, toUI } from "../util";
import { boxScoreToLiveSim } from "../views/liveGame";

export const getLeagues = async () => {
	const leagues = await idb.meta.getAll("leagues");
	return leagues
		.map(league => ({
			lid: league.lid,
			name: league.name,
		}))
		.reverse();
};

export const getSeasons = async (lid: number) => {
	const league = await connectLeague(lid);
	const store = league.transaction("gameAttributes").store;
	const season = await store.get("season");
	const startingSeason = await store.get("startingSeason");

	if (!season) {
		throw new Error("Invalid season");
	}
	if (!startingSeason) {
		throw new Error("Invalid startingSeason");
	}
	console.log(startingSeason, season);

	return {
		seasonStart: startingSeason.value as number,
		seasonEnd: season.value as number,
	};
};

export const simExhibitionGame = async (
	{
		disableHomeCourtAdvantage,
		gameAttributes,
		phase,
		teams,
	}: {
		disableHomeCourtAdvantage: boolean;
		gameAttributes: ExhibitionGameAttributes;
		phase: typeof PHASE["REGULAR_SEASON"] | typeof PHASE["PLAYOFFS"];
		teams: [ExhibitionTeam, ExhibitionTeam];
	},
	conditions: Conditions,
) => {
	g.setWithoutSavingToDB("phase", phase);
	g.setWithoutSavingToDB("userTids", [0, 1]);
	g.setWithoutSavingToDB("userTid", 0);

	const settingsCannotChange = [
		"budget",
		"spectator",
		"otl",
		"elamASG",
	] as const;

	for (const key of settingsCannotChange) {
		g.setWithoutSavingToDB(key, defaultGameAttributes[key]);
	}
	for (const key of EXHIBITION_GAME_SETTINGS) {
		g.setWithoutSavingToDB(key, gameAttributes[key]);
	}

	const teamsProcessed = teams.map((t, tid) =>
		processTeam(
			{
				tid,
				playThroughInjuries: DEFAULT_PLAY_THROUGH_INJURIES,
			},
			{
				won: t.seasonInfo?.won ?? 0,
				lost: t.seasonInfo?.lost ?? 0,
				tied: t.seasonInfo?.tied ?? 0,
				otl: t.seasonInfo?.otl ?? 0,
				cid: 0,
				did: 0,
				expenses: {
					health: {
						rank: 1,
					},
				},
			},
			t.players,
		),
	) as [any, any];

	const result = new GameSim({
		gid: 0,
		day: -1,
		teams: teamsProcessed,
		doPlayByPlay: true,
		homeCourtFactor: 1,
		disableHomeCourtAdvantage,
		allStarGame: false,
		baseInjuryRate: defaultGameAttributes.injuryRate,
		dh: false,
	}).run();

	// Hacky way to skip playoff database access in gameSimToBoxScore
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);

	const { gameStats: boxScore } = await gameSimToBoxScore(
		result,
		DEFAULT_STADIUM_CAPACITY,
	);

	const liveSim = await boxScoreToLiveSim({
		allStars: undefined,
		confetti: false,
		boxScore,
		playByPlay: result.playByPlay as any,
		teamSeasonOverrides: teams,
	});
	for (let i = 0; i < 2; i++) {
		const j = i === 0 ? 1 : 0;
		liveSim.initialBoxScore.teams[i].season = teams[j].season;
	}

	liveSim.initialBoxScore.exhibition = true;

	await toUI(
		"realtimeUpdate",
		[
			[],
			"/exhibition/game",
			{
				liveSim,
			},
		],
		conditions,
	);
};
