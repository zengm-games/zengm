import { bySport } from "../../common/index.ts";
import { maxBy } from "../../common/utils.ts";

// Would be better as part of idb.getCopies.playersPlus
const processPlayersHallOfFame = <
	T extends {
		careerStats: any;
		ratings: any;
		stats: any[];

		// For most.ts
		most?: {
			extra?: {
				bestSeasonOverride?: number | undefined;
			};
		};
	},
>(
	players: T[],
): (T & {
	bestStats: any;
	bestPos: string;
	legacyTid: number;
	peakOvr: number;
})[] => {
	return players.map((p) => {
		let peakOvr = 0;
		if (Array.isArray(p.ratings)) {
			for (const pr of p.ratings) {
				if (pr.ovr > peakOvr) {
					peakOvr = pr.ovr;
				}
			}
		}
		const bestSeasonOverride = p.most?.extra?.bestSeasonOverride;

		const hasSeasonWithGamesPlayed = p.stats.some((ps) => ps.gp > 0);

		const posBySeason: Record<number, string> = {};

		for (const row of p.ratings) {
			if (row.pos !== undefined && row.season !== undefined) {
				posBySeason[row.season] = row.pos;
			}
		}

		let bestEWA = -Infinity;
		let bestStats;
		let bestPos: string | undefined;
		const posByEWA: Record<string, number> = {};
		const teamSums: Record<number, number> = {};
		for (const ps of p.stats) {
			const tid = ps.tid;
			const ewa = bySport({
				baseball: ps.war,
				basketball: ps.ewa,
				football: ps.av,
				hockey: ps.ps,
			});
			if (bestSeasonOverride !== undefined) {
				if (ps.season === bestSeasonOverride) {
					bestStats = ps;
					bestPos = posBySeason[ps.season];
				}
			} else {
				if (ewa > bestEWA) {
					if (!hasSeasonWithGamesPlayed || ps.gp > 0) {
						bestStats = ps;
						bestEWA = ewa;
					}
				}

				const pos = posBySeason[ps.season];
				if (pos !== undefined) {
					//console.log(ps.pos, ps)
					if (posByEWA[pos] === undefined) {
						posByEWA[pos] = ewa;
					} else {
						posByEWA[pos] += ewa;
					}
				}
			}
			if (Object.hasOwn(teamSums, tid)) {
				teamSums[tid] += ewa;
			} else {
				teamSums[tid] = ewa;
			}
		}
		if (bestStats === undefined) {
			bestStats = p.careerStats;
		}
		if (bestPos === undefined) {
			bestPos =
				maxBy(Object.entries(posByEWA), ([, ewa]) => ewa)?.[0] ??
				p.ratings.at(-1)?.pos;
		}

		const legacyTid = Number.parseInt(
			Object.keys(teamSums).reduce(
				(teamA: any, teamB: any) =>
					teamSums[teamA]! > teamSums[teamB]! ? teamA : teamB,
				-1,
			),
		);

		return {
			...p,
			bestPos: bestPos ?? "?",
			bestStats,
			peakOvr,
			legacyTid,
		};
	});
};

export default processPlayersHallOfFame;
