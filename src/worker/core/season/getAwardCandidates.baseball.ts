import { AWARD_NAMES } from "../../../common";
import { getPlayers, getTopPlayers } from "./awards";
import { mvpScore, poyScore, rpoyFilter, royFilter } from "./doAwards.baseball";

const getAwardCandidates = async (season: number) => {
	const players = await getPlayers(season);

	const awardCandidates = [
		{
			name: AWARD_NAMES.mvp,
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					score: mvpScore,
				},
				players,
			),
			stats: ["keyStats", "war"],
		},
		{
			name: AWARD_NAMES.poy,
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					score: poyScore,
				},
				players,
			),
			stats: ["w", "l", "era", "ip", "rpit"],
		},
		{
			name: AWARD_NAMES.rpoy,
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					filter: rpoyFilter,
					score: poyScore,
				},
				players,
			),
			stats: ["sv", "era", "ip", "rpit"],
		},
		{
			name: AWARD_NAMES.roy,
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					filter: royFilter,
					score: mvpScore,
				},
				players,
			),
			stats: ["keyStats", "war"],
		},
	];

	return awardCandidates;
};

export default getAwardCandidates;
