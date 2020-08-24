/* eslint-disable */

let lid;
async function simSeason() {
	await bbgm.toUI("realtimeUpdate", [[], "/"]);
	await bbgm.league.close(true);
	if (lid !== undefined) {
		await bbgm.league.remove(lid);
	}

	lid = await bbgm.league.create({
		name: "League Name",
		tid: 0,
		leagueFile: {
			startingSeason: 2020,
		},
	});

	await bbgm.phase.newPhase(bbgm.PHASE.REGULAR_SEASON);
	await bbgm.game.play(1000); // Regular season
	await bbgm.game.play(100); // Playoffs

	const playoffSeries = await bbgm.idb.cache.playoffSeries.get(bbgm.g.season);
	return playoffSeries.series.map(round =>
		round.map(matchup =>
			matchup.home.won > matchup.away.won
				? matchup.home.seed
				: matchup.away.seed,
		),
	);
}

const N = 100;

//const seedWinsByRound = [{}, {}, {}, {}];
const seedWinsByRound = [
	{ 1: 93, 2: 84, 3: 72, 4: 60, 5: 52, 6: 40, 7: 28, 8: 19 },
	{ 1: 74, 2: 57, 3: 30, 4: 15, 5: 18, 6: 13, 7: 12, 8: 5 },
	{ 1: 39, 2: 35, 3: 14, 4: 5, 5: 5, 6: 7, 7: 6, 8: 1 },
	{ 1: 25, 2: 9, 3: 11, 4: 3, 5: 1, 6: 3, 7: 4 },
];
for (let i = 56; i < N; i++) {
	const result = await simSeason();
	console.log(result);
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
	console.log(i + 1, seedWinsByRound);
}
