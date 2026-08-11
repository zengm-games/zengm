import { bySport } from "../../../common/sportFunctions.ts";
import type { Award2 } from "../../../common/types.ts";
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

	const awardCandidateStats: Partial<Record<Award2["showStats"], string[]>> =
		bySport({
			baseball: {
				overall: ["keyStats", "war"],
				sp: ["w", "l", "era", "ip", "war"],
				rp: ["sv", "era", "ip", "war"],
				offense: ["pa", "hr", "ba", "ops", "war"],
				defense: ["pa", "hr", "ba", "ops", "war"], // Showing actualy defensive stats would be annoying because arrays
			},
			basketball: {
				offense: ["pts", "trb", "ast", "per"],
				defense: ["trb", "blk", "stl", "dws"],
			},
			football: {
				overall: ["keyStats", "av"],
				defense: ["defTck", "defSk", "defPssDef", "defInt", "av"],
				blocking: ["pbw", "pbwr", "rbw", "rbwr", "av"],
			},
			hockey: {
				overall: ["keyStats", "ps"],
				defense: ["tk", "hit", "dps"],
				goalkeeping: ["gpGoalie", "gaa", "svPct", "gps"],
			},
		});

	const awardCandidates = realizedAwards.map(({ award }) => {
		const stats = awardCandidateStats[award.showStats];
		if (!stats) {
			throw new Error("Invalid showStats");
		}

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
						score: p.scores[award.formula],
					},
				};
			}),
			stats: [...stats, "score"],
		};
	});

	return awardCandidates;
};

export default getAwardCandidates;
