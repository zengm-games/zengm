import { DEFAULT_PLAY_THROUGH_INJURIES, PHASE } from "../../common";
import type { ExhibitionTeam } from "../../ui/views/Exhibition";
import { GameSim } from "../core";
import { processTeam } from "../core/game/loadTeams";
import { defaultGameAttributes, g } from "../util";

const simExhibitionGame = ({
	teams,
	disableHomeCourtAdvantage,
}: {
	teams: [ExhibitionTeam, ExhibitionTeam];
	disableHomeCourtAdvantage: boolean;
}) => {
	console.log(teams, disableHomeCourtAdvantage);
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	g.setWithoutSavingToDB("userTids", [0, 1]);
	const applyDefaults = [
		"ties",
		"otl",
		"budget",
		"spectator",
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
	] as const;
	for (const key of applyDefaults) {
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
		gid: -1,
		day: -1,
		teams: teamsProcessed,
		doPlayByPlay: true,
		homeCourtFactor: 1,
		disableHomeCourtAdvantage,
		allStarGame: false,
		baseInjuryRate: defaultGameAttributes.injuryRate,
		dh: false,
	}).run();

	console.log(result);
};

export default simExhibitionGame;
