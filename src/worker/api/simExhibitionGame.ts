import {
	DEFAULT_PLAY_THROUGH_INJURIES,
	DEFAULT_STADIUM_CAPACITY,
	PHASE,
} from "../../common";
import type { Conditions, GameAttributesLeague } from "../../common/types";
import type { ExhibitionTeam } from "../../ui/views/Exhibition";
import { GameSim } from "../core";
import { processTeam } from "../core/game/loadTeams";
import { gameSimToBoxScore } from "../core/game/writeGameStats";
import { defaultGameAttributes, g, toUI } from "../util";
import { boxScoreToLiveSim } from "../views/liveGame";

const EXHIBITION_GAME_SETTINGS: (keyof GameAttributesLeague)[] = [
	"ties",
	"otl",
	"dh",
	"numPlayersOnCourt",
	"foulsNeededToFoulOut",
	"numPlayersOnCourt",
	"quarterLength",
	"numPeriods",
	"pace",
	"elamASG",
	"elam",
	"homeCourtAdvantage",
	"elamMinutes",
	"elamPoints",
	"foulsUntilBonus",
	"foulRateFactor",
	"turnoverFactor",
	"stealFactor",
	"threePointTendencyFactor",
	"threePointAccuracyFactor",
	"twoPointAccuracyFactor",
	"foulRateFactor",
	"threePointers",
	"blockFactor",
	"threePointers",
	"orbFactor",
];

const simExhibitionGame = async (
	{
		disableHomeCourtAdvantage,
		hash,
		teams,
	}: {
		disableHomeCourtAdvantage: boolean;
		hash: string;
		teams: [ExhibitionTeam, ExhibitionTeam];
	},
	conditions: Conditions,
) => {
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	g.setWithoutSavingToDB("userTids", [0, 1]);
	g.setWithoutSavingToDB("userTid", 0);
	const settingsCannotChange: typeof EXHIBITION_GAME_SETTINGS = [
		"budget",
		"spectator",
	];
	for (const key of [...settingsCannotChange, ...EXHIBITION_GAME_SETTINGS]) {
		g.setWithoutSavingToDB(key, defaultGameAttributes[key]);
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
				hash,
				liveSim,
			},
		],
		conditions,
	);
};

export default simExhibitionGame;
