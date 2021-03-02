import { getPlayers, getTopPlayers } from "./awards";
import {
	dpoyScore,
	dfoyFilter,
	mvpScore,
	goyScore,
	royFilter,
	royScore,
} from "./doAwards.hockey";

const getAwardCandidates = async (season: number) => {
	const players = await getPlayers(season);

	const awardCandidates = [
		{
			name: "Most Valuable Player",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					score: mvpScore,
				},
				players,
			),
			stats: ["keyStats", "ps"],
		},
		{
			name: "Defensive Player of the Year",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					score: dpoyScore,
				},
				players,
			),
			stats: ["tk", "hit", "dps"],
		},
		{
			name: "Defensive Forward of the Year",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					filter: dfoyFilter,
					score: dpoyScore,
				},
				players,
			),
			stats: ["tk", "hit", "dps"],
		},
		{
			name: "Goalie of the Year",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					score: goyScore,
				},
				players,
			),
			stats: ["gaa", "svPct", "gps"],
		},
		{
			name: "Rookie of the Year",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					filter: royFilter,
					score: royScore,
				},
				players,
			),
			stats: ["keyStats", "ps"],
		},
	];

	return awardCandidates;
};

export default getAwardCandidates;
