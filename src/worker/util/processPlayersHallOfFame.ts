import { bySport } from "../../common";

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
	legacyTid: number;
	peakOvr: number;
})[] => {
	return players.map(p => {
		let peakOvr = 0;
		if (Array.isArray(p.ratings)) {
			for (const pr of p.ratings) {
				if (pr.ovr > peakOvr) {
					peakOvr = pr.ovr;
				}
			}
		}
		const bestSeasonOverride = p.most?.extra?.bestSeasonOverride;

		const hasSeasonWithGamesPlayed = p.stats.some(ps => ps.gp > 0);

		let bestEWA = -Infinity;
		let bestStats;
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
				}
			} else {
				if (ewa > bestEWA) {
					if (!hasSeasonWithGamesPlayed || ps.gp > 0) {
						bestStats = ps;
						bestEWA = ewa;
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

		const legacyTid = parseInt(
			Object.keys(teamSums).reduce(
				(teamA: any, teamB: any) =>
					teamSums[teamA] > teamSums[teamB] ? teamA : teamB,
				-1,
			),
		);

		return {
			...p,
			bestStats,
			peakOvr,
			legacyTid,
		};
	});
};

export default processPlayersHallOfFame;
