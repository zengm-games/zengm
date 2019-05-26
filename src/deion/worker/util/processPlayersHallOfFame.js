// Would be better as part of idb.getCopies.playersPlus
const processPlayersHallOfFame = players => {
    for (const p of players) {
        p.peakOvr = 0;
        for (const pr of p.ratings) {
            if (pr.ovr > p.peakOvr) {
                p.peakOvr = pr.ovr;
            }
        }

        let bestEWA = -Infinity;
        p.teamSums = {};
        for (let j = 0; j < p.stats.length; j++) {
            const tid = p.stats[j].tid;
            const EWA =
                process.env.SPORT === "basketball"
                    ? p.stats[j].ewa
                    : p.stats[j].av;
            if (EWA > bestEWA) {
                p.bestStats = p.stats[j];
                bestEWA = EWA;
            }
            if (p.teamSums.hasOwnProperty(tid)) {
                p.teamSums[tid] += EWA;
            } else {
                p.teamSums[tid] = EWA;
            }
        }
        if (p.bestStats === undefined) {
            p.bestStats = p.careerStats;
        }

        p.legacyTid = parseInt(
            Object.keys(p.teamSums).reduce(
                (teamA, teamB) =>
                    p.teamSums[teamA] > p.teamSums[teamB] ? teamA : teamB,
                -1,
            ),
            10,
        );
    }
};

export default processPlayersHallOfFame;
