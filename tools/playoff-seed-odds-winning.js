const playoffSeries = await bbgm.idb.getCopies.playoffSeries();
const seedWinsByRound = [{}, {}, {}, {}];
for (const row of playoffSeries) {
	const result = row.series.map((round) =>
		round.map((matchup) =>
			matchup.away && matchup.away.won > matchup.home.won
				? matchup.away.seed
				: matchup.home.seed,
		),
	);
	for (let i = 0; i < result.length; i++) {
		const round = result[i];
		for (const seed of round) {
			if (seedWinsByRound[i][seed] === undefined) {
				seedWinsByRound[i][seed] = 1;
			} else {
				seedWinsByRound[i][seed] += 1;
			}
		}
	}
}
for (const [round, info] of Object.entries(seedWinsByRound)) {
	console.log(`Round ${Number.parseInt(round) + 1}:`, info);
}
