import { getPlayers, getTopPlayers } from "./awards.ts";
import {
	mvpScore,
	dpoyScore,
	opoyScore,
	poyScore,
	offScore,
} from "./doAwards.football.ts";
import type { PlayerFiltered } from "../../../common/types.ts";

const filterPosition =
	(season: number, positions: string[]) => (p: PlayerFiltered) => {
		let pr;
		for (let i = p.ratings.length - 1; i >= 0; i--) {
			if (p.ratings[i].season === season) {
				pr = p.ratings[i];
				break;
			}
		}

		if (!pr) {
			return false;
		}

		return positions.includes(pr.pos);
	};

const filterRoy = (season: number) => (p: PlayerFiltered) => {
	if (p.draft.year !== season - 1) {
		return false;
	}

	return true;
};

const getAwardCandidates = async (season: number) => {
	const players = await getPlayers(season);

	const awardCandidates = [
		{
			name: "Most Valuable Player",
			players: getTopPlayers(
				{
					amount: 10,
					score: mvpScore,
				},
				players,
			),
			stats: ["keyStats"],
		},
		{
			name: "Offensive Player of the Year",
			players: getTopPlayers(
				{
					amount: 10,
					score: opoyScore,
				},
				players,
			),
			stats: ["keyStats"],
			asterisk: "Exceptional QBs can win both MVP and OPOY in some seasons",
		},
		{
			name: "Protector of the Year",
			players: getTopPlayers(
				{
					amount: 10,
					filter: filterPosition(season, ["OL"]),
					score: poyScore,
				},
				players,
			),
			stats: ["pbw", "pbwr", "rbw", "rbwr"],
		},
		{
			name: "Defensive Player of the Year",
			players: getTopPlayers(
				{
					amount: 10,
					score: dpoyScore,
				},
				players,
			),
			stats: ["keyStats"],
		},
		{
			name: "Offensive Rookie of the Year",
			players: getTopPlayers(
				{
					amount: 10,
					filter: filterRoy(season),
					score: offScore,
				},
				players,
			),
			stats: ["keyStats"],
		},
		{
			name: "Defensive Rookie of the Year",
			players: getTopPlayers(
				{
					amount: 10,
					filter: filterRoy(season),
					score: dpoyScore,
				},
				players,
			),
			stats: ["keyStats"],
		},
	];

	return awardCandidates;
};

export default getAwardCandidates;
