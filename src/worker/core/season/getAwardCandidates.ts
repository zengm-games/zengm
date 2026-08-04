import { groupByUnique } from "../../../common/utils.ts";
import g from "../../util/g.ts";
import { processAwards } from "./doAwards.ts";

const getAwardCandidates = async (season: number) => {
	const { realizedAwards, players } = await processAwards({
		awards: g
			.get("awards")
			.filter(
				(award) =>
					award.numTeams === undefined && award.statRange === undefined,
			),
		numPlayersPerIndividualAward: 10,
		season,
	});

	const playersByPid = groupByUnique(players, "pid");

	const awardCandidates = realizedAwards.map(({ award, index }) => {
		return {
			...award,
			players: award.winner.map((p2) => {
				if (Array.isArray(p2)) {
					throw new Error("Should never happen");
				}

				const p = playersByPid[p2.pid];
				return {
					...p,
					currentStats: {
						...p.currentStats,
						score: p.scores[index],
					},
				};
			}),
			stats: ["pts", "trb", "ast", "score"],
		};
	});

	return awardCandidates;
};

export default getAwardCandidates;
