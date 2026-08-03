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

	const awardCandidates = realizedAwards.map((award) => {
		return {
			name: award.name,
			players: award.winner.map((p) => playersByPid[p.pid]),
			stats: ["pts", "trb", "ast", "per"],
		};
	});

	return awardCandidates;
};

export default getAwardCandidates;
