import { getPlayers, getTopPlayers } from "./awards";
import {
	dpoyScore,
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
			stats: ["pts"],
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
			stats: ["tk"],
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
			stats: ["gaa"],
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
			stats: ["pts"],
		},
	];

	return awardCandidates;
};

export default getAwardCandidates;
