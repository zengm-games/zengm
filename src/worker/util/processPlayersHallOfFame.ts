// Would be better as part of idb.getCopies.playersPlus
const processPlayersHallOfFame = <
	T extends {
		careerStats: any;
		ratings: any[];
		stats: any[];
	}
>(
	players: T[],
): (T & {
	bestStats: any;
	legacyTid: number;
	peakOvr: number;
})[] => {
	return players.map(p => {
		let peakOvr = 0;
		for (const pr of p.ratings) {
			if (pr.ovr > peakOvr) {
				peakOvr = pr.ovr;
			}
		}

		let bestEWA = -Infinity;
		let bestStats;
		const teamSums: Record<number, number> = {};
		for (let j = 0; j < p.stats.length; j++) {
			const tid = p.stats[j].tid;
			const EWA =
				process.env.SPORT === "basketball" ? p.stats[j].ewa : p.stats[j].av;
			if (EWA > bestEWA) {
				bestStats = p.stats[j];
				bestEWA = EWA;
			}
			if (teamSums.hasOwnProperty(tid)) {
				teamSums[tid] += EWA;
			} else {
				teamSums[tid] = EWA;
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
			10,
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
