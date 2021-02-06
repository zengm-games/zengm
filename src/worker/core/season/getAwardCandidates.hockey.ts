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
			stats: ["keyStats"],
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
			stats: ["keyStats"],
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
			stats: ["keyStats"],
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
			stats: ["keyStats"],
		},
	];

	return awardCandidates;
};

export default getAwardCandidates;
