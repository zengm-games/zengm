import { helpers, random } from "../../util";

const groupScheduleSeries = (tids: [number, number][]) => {
	const matchupToKey = (matchup: [number, number]) =>
		`${matchup[0]}-${matchup[1]}` as const;
	type MatchupKey = ReturnType<typeof matchupToKey>;
	const keyToMatchup = (key: MatchupKey) => {
		const parts = key.split("-");
		return [parseInt(parts[0]), parseInt(parts[1])] as const;
	};

	// Group all games between same teams with same home/away
	const matchupsGroupedByTeams: Record<MatchupKey, [number, number][]> = {};
	for (const matchup of tids) {
		const key = matchupToKey(matchup);
		if (!matchupsGroupedByTeams[key]) {
			matchupsGroupedByTeams[key] = [];
		}
		matchupsGroupedByTeams[key].push(matchup);
	}

	// Divide into groups of 3 or 4
	const seriesGroupedByTeams: Record<MatchupKey, (1 | 2 | 3 | 4)[]> = {};
	for (const key of helpers.keys(matchupsGroupedByTeams)) {
		const matchups = matchupsGroupedByTeams[key];
		seriesGroupedByTeams[key] = [];

		// Take series of 3 or 4 as long as possible
		while (matchups.length > 0) {
			let targetLength: 1 | 2 | 3 | 4;
			if (matchups.length === 1) {
				targetLength = 1;
			} else if (matchups.length === 2) {
				targetLength = 2;
			} else if (
				matchups.length === 3 ||
				matchups.length === 6 ||
				matchups.length === 9
			) {
				targetLength = 3;
			} else {
				targetLength = 4;
			}

			matchups.splice(0, targetLength);
			seriesGroupedByTeams[key].push(targetLength);
		}
	}
	for (const series of Object.values(seriesGroupedByTeams)) {
		// Randomize, or all the short series will be at the end
		random.shuffle(series);
	}

	let ongoingSeries: {
		matchup: readonly [number, number];
		numGamesLeft: number;
	}[] = [];

	const numGamesTotal = tids.length;
	const tidsFinal: [number, number][] = [];
	const seriesKeys = helpers.keys(seriesGroupedByTeams);

	while (tidsFinal.length < numGamesTotal) {
		// Schedule games from ongoingSeries
		console.log(ongoingSeries.length);
		for (const series of ongoingSeries) {
			tidsFinal.push([...series.matchup]);

			series.numGamesLeft -= 1;
		}

		// Remove any series that are over
		ongoingSeries = ongoingSeries.filter(series => series.numGamesLeft > 0);

		// Add new series from teams not yet in an ongoing series for tomorrow
		const tidsForTomorrow = new Set();
		for (const series of ongoingSeries) {
			tidsForTomorrow.add(series.matchup[0]);
			tidsForTomorrow.add(series.matchup[1]);
		}

		// Shuffle each day so it doesn't keep picking the same team first
		random.shuffle(seriesKeys);

		for (const key of seriesKeys) {
			const seriesAvailable = seriesGroupedByTeams[key];
			if (seriesAvailable.length === 0) {
				continue;
			}

			const matchup = keyToMatchup(key);

			if (tidsForTomorrow.has(matchup[0]) || tidsForTomorrow.has(matchup[1])) {
				continue;
			}

			const numGames = seriesAvailable.pop();
			if (numGames === undefined) {
				continue;
			}

			ongoingSeries.push({
				matchup,
				numGamesLeft: numGames,
			});
			tidsForTomorrow.add(matchup[0]);
			tidsForTomorrow.add(matchup[1]);
		}
	}

	return tidsFinal;
};

export default groupScheduleSeries;
