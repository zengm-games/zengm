import { orderBy } from "../../../common/utils";
import { random } from "../../util";

const groupScheduleCompact = (tids: [number, number][]) => {
	const dailyMatchups: [number, number][][] = [];

	const matchups = [...tids];
	random.shuffle(matchups);

	const remainingMatchups = new Set(matchups);

	const allTids = new Set(tids.flat());

	while (remainingMatchups.size > 0) {
		const tidsUsed = new Set();

		const matchupsToday: [number, number][] = [];
		dailyMatchups.push(matchupsToday);

		// First look at games from teams with the most games left, otherwise they might be left until the end and take up entire days with one team
		const numGamesLeftByTid: Record<number, number> = {};
		for (const matchup of remainingMatchups) {
			for (const tid of matchup) {
				if (numGamesLeftByTid[tid] === undefined) {
					numGamesLeftByTid[tid] = 1;
				} else {
					numGamesLeftByTid[tid] += 1;
				}
			}
		}
		const remainingMatchupsArray = orderBy(
			Array.from(remainingMatchups),
			matchup => {
				return Math.min(...matchup.map(tid => numGamesLeftByTid[tid] ?? 0));
			},
			"desc",
		);

		for (const matchup of remainingMatchupsArray) {
			if (!tidsUsed.has(matchup[0]) && !tidsUsed.has(matchup[1])) {
				matchupsToday.push(matchup);
				remainingMatchups.delete(matchup);
				tidsUsed.add(matchup[0]);
				tidsUsed.add(matchup[1]);

				if (tidsUsed.size === allTids.size) {
					break;
				}
			}
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

	// Some jaggedness remains, so just randomize it
	random.shuffle(dailyMatchups);

	return dailyMatchups.flat();
};

export default groupScheduleCompact;
