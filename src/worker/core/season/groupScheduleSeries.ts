import orderBy from "lodash-es/orderBy";
import { helpers, random } from "../../util";

const groupScheduleSeries = (tids: [number, number][]) => {
	const matchupToKey = (matchup: [number, number]) =>
		`${matchup[0]}-${matchup[1]}` as const;
	type MatchupKey = ReturnType<typeof matchupToKey>;

	const matchupsByKey: Record<MatchupKey, [number, number]> = {};

	// Group all games between same teams with same home/away
	const matchupsGroupedByTeams: Record<MatchupKey, number> = {};
	for (const matchup of tids) {
		const key = matchupToKey(matchup);
		matchupsByKey[key] = matchup;
		if (!matchupsGroupedByTeams[key]) {
			matchupsGroupedByTeams[key] = 0;
		}
		matchupsGroupedByTeams[key] += 1;
	}

	// Divide into groups of 3 or 4
	const seriesGroupedByTeams: Record<MatchupKey, (1 | 2 | 3 | 4)[]> = {};
	for (const key of helpers.keys(matchupsGroupedByTeams)) {
		let numGamesLeft = matchupsGroupedByTeams[key];
		seriesGroupedByTeams[key] = [];

		// Take series of 3 or 4 as long as possible
		while (numGamesLeft > 0) {
			let targetLength: 1 | 2 | 3 | 4;
			if (numGamesLeft === 1) {
				targetLength = 1;
			} else if (numGamesLeft === 2) {
				targetLength = 2;
			} else if (
				numGamesLeft === 3 ||
				numGamesLeft === 6 ||
				numGamesLeft === 9
			) {
				targetLength = 3;
			} else {
				targetLength = 4;
			}

			numGamesLeft -= targetLength;
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
	const dailyMatchups: [number, number][][] = [];
	let seriesKeys = helpers.keys(seriesGroupedByTeams);
	let numGamesScheduled = 0;

	while (numGamesScheduled < numGamesTotal) {
		// Schedule games from ongoingSeries
		const tidsToday: [number, number][] = [];
		dailyMatchups.push(tidsToday);
		for (const series of ongoingSeries) {
			tidsToday.push([...series.matchup]);
			series.numGamesLeft -= 1;
			numGamesScheduled += 1;
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

		// Order by number of series reamining, otherwise it tends to have some bunched series against the same team at the end of the season
		seriesKeys = orderBy(
			seriesKeys,
			key => seriesGroupedByTeams[key].length,
			"desc",
		);

		for (const key of seriesKeys) {
			const seriesAvailable = seriesGroupedByTeams[key];
			if (seriesAvailable.length === 0) {
				continue;
			}

			const matchup = matchupsByKey[key];

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

	// Start on 2nd to last day, see what we can move to the last day. Keep repeating, going further back each time. This is to make the end of season schedule less "jagged" (fewer teams that end the season early)
	for (
		let startIndex = dailyMatchups.length - 2;
		startIndex >= 0;
		startIndex--
	) {
		for (let i = startIndex; i < dailyMatchups.length - 1; i++) {
			const today = dailyMatchups[i];
			const tomorrow = dailyMatchups[i + 1];

			const tidsTomorrow = new Set(tomorrow.flat());

			const toRemove = [];
			for (let k = 0; k < today.length; k++) {
				const matchup = today[k];
				if (!tidsTomorrow.has(matchup[0]) && !tidsTomorrow.has(matchup[1])) {
					tomorrow.push(matchup);
					toRemove.push(k);
				}
			}

			// Remove from end, so indexes don't change
			toRemove.reverse();
			for (const index of toRemove) {
				today.splice(index, 1);
			}
		}
	}

	// Some jaggedness remains, so just reverse it and put it at the beginning of the season. Not ideal, but it's less weird there.
	dailyMatchups.reverse();

	return dailyMatchups.flat();
};

export default groupScheduleSeries;
