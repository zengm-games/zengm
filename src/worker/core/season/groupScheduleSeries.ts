import { random } from "../../util";

const groupScheduleSeries = (tids: [number, number][]) => {
	// Group all games between same teams with same home/away
	const matchupsGroupedByTeams: Record<string, [number, number][]> = {};
	for (const matchup of tids) {
		const key = `${matchup[0]}-${matchup[1]}`;
		if (!matchupsGroupedByTeams[key]) {
			matchupsGroupedByTeams[key] = [];
		}
		matchupsGroupedByTeams[key].push(matchup);
	}
	console.log(
		"matchupsGroupedByTeams",
		structuredClone(matchupsGroupedByTeams),
	);

	// Divide into groups of 3 or 4
	const seriesGroupedByTeams: Record<
		string,
		Record<1 | 2 | 3 | 4, [number, number][][]>
	> = {};
	for (const [key, matchups] of Object.entries(matchupsGroupedByTeams)) {
		seriesGroupedByTeams[key] = {
			1: [],
			2: [],
			3: [],
			4: [],
		};

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

			seriesGroupedByTeams[key][targetLength].push(
				matchups.splice(0, targetLength),
			);
		}
	}
	console.log("seriesGroupedByTeams", structuredClone(seriesGroupedByTeams));

	// Take a set of concurrent series (no duplicate teams) of same length (if possible)
	const allConcurrentSeries: [number, number][][][] = [];
	const seriesKeys = Object.keys(seriesGroupedByTeams);
	while (true) {
		const concurrentSeries: [number, number][][] = [];
		const tidsUsed = new Map<number, number>();

		random.shuffle(seriesKeys);

		let maxLength = 0;
		for (const key of seriesKeys) {
			// Find the longest series, if one exists
			for (const length of [4, 3, 2, 1] as const) {
				if (seriesGroupedByTeams[key][length].length > 0) {
					const [tid1, tid2] = seriesGroupedByTeams[key][length][0][0];
					if (tidsUsed.has(tid1) || tidsUsed.has(tid2)) {
						// Skip if team is already playing in another concurrent series
						break;
					}

					const series = seriesGroupedByTeams[key][length].pop();
					if (series) {
						// We're using this series
						const seriesLength = series.length;
						tidsUsed.set(tid1, seriesLength);
						tidsUsed.set(tid2, seriesLength);
						if (seriesLength > maxLength) {
							maxLength = seriesLength;
						}

						concurrentSeries.push(series);
						break;
					}
				}
			}
		}

		// If possible, add some other short series
		if (maxLength > 1) {
			for (const key of seriesKeys) {
				// Skip 4 game series, but maybe another can fit in
				for (const length of [3, 2, 1] as const) {
					if (seriesGroupedByTeams[key][length].length > 0) {
						const [tid1, tid2] = seriesGroupedByTeams[key][length][0][0];
						const numGames1 = (tidsUsed.get(tid1) ?? 0) + length;
						const numGames2 = (tidsUsed.get(tid2) ?? 0) + length;
						if (numGames1 > maxLength || numGames2 > maxLength) {
							// Skip if this series would be too long to play concurrently
							break;
						}

						const series = seriesGroupedByTeams[key][length].pop();
						if (series) {
							// We're using this series
							tidsUsed.set(tid1, numGames1);
							tidsUsed.set(tid2, numGames2);

							concurrentSeries.push(series);
							console.log("add", key, length);
							break;
						}
					}
				}
			}
		}

		if (concurrentSeries.length === 0) {
			// Couldn't find any series, that means they are all handled already
			break;
		}

		allConcurrentSeries.push(concurrentSeries);
	}
	random.shuffle(allConcurrentSeries);
	console.log("allConcurrentSeries", structuredClone(allConcurrentSeries));

	// Interleave games of the series
	const matchupsGroupedByDay: [number, number][][] = [];
	for (const concurrentSeries of allConcurrentSeries) {
		while (true) {
			const tidsUsed = new Set();
			const matchupsDay: [number, number][] = [];

			for (const series of concurrentSeries) {
				const matchup = series[0];
				if (matchup) {
					// Make sure we haven't already used this team today, for the case where e.g. some teams have a 4-game series, but other teams have 2 2-game series
					const [tid1, tid2] = matchup;
					if (!tidsUsed.has(tid1) && !tidsUsed.has(tid2)) {
						matchupsDay.push(matchup);
						tidsUsed.add(tid1);
						tidsUsed.add(tid2);
						series.shift();
					}
				}
			}

			if (matchupsDay.length > 0) {
				matchupsGroupedByDay.push(matchupsDay);
			} else {
				break;
			}
		}
	}
	console.log("matchupsGroupedByDay", structuredClone(matchupsGroupedByDay));

	// Randomly append all series games
	const tidsFinal: [number, number][] = [];
	for (const matchupsDay of matchupsGroupedByDay) {
		tidsFinal.push(...matchupsDay);
	}
	console.log("tidsFinal", structuredClone(tidsFinal));

	return tidsFinal;
};

export default groupScheduleSeries;
