import {
	getPlayers,
	getTopPlayers,
} from "../../../../deion/worker/core/season/awards";
import {
	dpoyScore,
	mipFilter,
	mipScore,
	mvpScore,
	royFilter,
	smoyFilter,
} from "./doAwards";

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
			stats: ["pts", "trb", "ast", "per"],
		},
		{
			name: "Rookie of the Year",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					filter: royFilter,
					score: mvpScore,
				},
				players,
			),
			stats: ["pts", "trb", "ast", "per"],
		},
		{
			name: "Sixth Man of the Year",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					filter: smoyFilter,
					score: mvpScore,
				},
				players,
			),
			stats: ["pts", "trb", "ast", "per"],
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
			stats: ["trb", "blk", "stl", "dws"],
		},
		{
			name: "Most Improved Player",
			players: getTopPlayers(
				{
					allowNone: true,
					amount: 10,
					filter: mipFilter,
					score: mipScore,
				},
				players,
			),
			stats: ["pts", "trb", "ast", "per"],
		},
	];
	console.log(players);
	console.log(awardCandidates);

	return awardCandidates;
};

export default getAwardCandidates;
