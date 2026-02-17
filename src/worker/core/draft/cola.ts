import type { Team } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import helpers from "../../util/helpers.ts";
import logEvent from "../../util/logEvent.ts";

const logDecrease = (before: number, t: Team) => {
	const text = `The lottery index for the <a href="${helpers.leagueUrl([
		"roster",
		`${t.abbrev}_${t.tid}`,
		g.get("season"),
	])}">${t.name}</a> decreased from ${before} to ${t.cola} due to their playoff success.`;

	logEvent({
		type: "draftLottery",
		text,
		showNotification: false,
		pids: [],
		tids: [t.tid],
		score: 0,
	});
};

// Champion gets their lottery index multiplied by 0. Loser of the finals, 0.25. Loser of the semifinals, 0.5. Loser of the quarterfinals, 0.75.
const PLAYOFF_FACTOR_CHAMP = 0;
const PLAYOFF_FACTORS_LOSERS = [0.75, 0.5, 0.25];

// Call this at the end of the playoffs
export const updateLotteryIndexesAfterPlayoffs = async () => {
	if (g.get("draftType") !== "cola") {
		return;
	}

	const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (!playoffSeries) {
		throw new Error("Missing playoffSeries");
	}

	const offset = numPlayoffRounds - PLAYOFF_FACTORS_LOSERS.length;
	for (const [i, factor] of PLAYOFF_FACTORS_LOSERS.entries()) {
		const roundIndex = offset + i;
		const series = playoffSeries.series[roundIndex];
		if (!series) {
			// Not enough rounds for this one to matter
			continue;
		}

		for (const matchup of series) {
			if (matchup.away) {
				const loser =
					matchup.away.won > matchup.home.won ? matchup.home : matchup.away;
				const t = await idb.cache.teams.get(loser.tid);
				if (!t) {
					throw new Error("Should never happen");
				}
				t.cola ??= 0;
				const before = t.cola;
				t.cola = Math.round(t.cola * factor);
				await idb.cache.teams.put(t);

				logDecrease(before, t);
			}

			// Finals - look at winner too
			if (series.length === 1) {
				const winner =
					!matchup.away || matchup.home.won > matchup.away.won
						? matchup.home
						: matchup.away;
				const t = await idb.cache.teams.get(winner.tid);
				if (!t) {
					throw new Error("Should never happen");
				}
				t.cola ??= 0;
				const before = t.cola;
				t.cola = Math.round(t.cola * PLAYOFF_FACTOR_CHAMP);
				await idb.cache.teams.put(t);

				logDecrease(before, t);
			}
		}
	}
};

// Call this to handle the case where there are no playoffs
export const updateLotteryIndexesAfterNoPlayoffs = async (tid: number) => {
	if (g.get("draftType") !== "cola") {
		return;
	}

	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Should never happen");
	}
	t.cola ??= 0;
	const before = t.cola;
	t.cola = Math.round(t.cola * PLAYOFF_FACTOR_CHAMP);
	await idb.cache.teams.put(t);

	logDecrease(before, t);
};
