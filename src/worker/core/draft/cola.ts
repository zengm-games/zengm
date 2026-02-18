import {
	COLA_ALPHA,
	COLA_OPT_OUT_PENALTY,
	PHASE,
} from "../../../common/constants.ts";
import type { Team } from "../../../common/types.ts";
import { range } from "../../../common/utils.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import helpers from "../../util/helpers.ts";
import logEvent from "../../util/logEvent.ts";
import getNumPlayoffTeams from "../season/getNumPlayoffTeams.ts";

// All teams up to the final 3 rounds of playoffs
export const getNumLotteryTeams = async () => {
	const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;
	let numPlayoffTeams;
	if (numPlayoffRounds <= 3) {
		// This handles byes
		numPlayoffTeams = (await getNumPlayoffTeams(g.get("season")))
			.numPlayoffTeams;
	} else {
		// Final 3 rounds
		numPlayoffTeams = 2 ** 3;
	}

	return g.get("numActiveTeams") - numPlayoffTeams;
};

const logChange = (
	before: number,
	t: Team,
	direction: "increased" | "decreased",
	reason: string,
) => {
	const text = `The lottery chances for the <a href="${helpers.leagueUrl([
		"roster",
		`${t.abbrev}_${t.tid}`,
		g.get("season"),
	])}">${t.name}</a> ${direction} from ${before} to ${t.cola}${reason}.`;

	logEvent({
		type: "draftLottery",
		text,
		showNotification: false,
		pids: [],
		tids: [t.tid],
		score: 0,
	});
};

// Champion gets their lottery chances multiplied by 0. Loser of the finals, 0.25. Loser of the semifinals, 0.5. Loser of the quarterfinals, 0.75.
const PLAYOFF_FACTORS = [0.75, 0.5, 0.25, 0];

// Call this at the end of the playoffs
export const updateLotteryChancesAfterPlayoffs = async () => {
	if (g.get("draftType") !== "cola") {
		return;
	}

	const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;

	// Add this to playoffRoundsWon and we can index into PLAYOFF_FACTORS
	const offset = numPlayoffRounds - PLAYOFF_FACTORS.length + 1;

	const teamSeasons = await idb.getCopies.teamSeasons(
		{ season: g.get("season") },
		"noCopyCache",
	);
	for (const row of teamSeasons) {
		const t = await idb.cache.teams.get(row.tid);
		if (!t) {
			throw new Error("Should never happen");
		}
		t.cola ??= 0;
		const before = t.cola;

		const factor = PLAYOFF_FACTORS[row.playoffRoundsWon - offset];
		if (row.playoffRoundsWon >= 0 && factor !== undefined) {
			t.cola = Math.round(t.cola * factor);
			logChange(before, t, "decreased", " due to their playoff success");
		} else {
			t.cola += COLA_ALPHA;
			logChange(before, t, "increased", "");
		}

		await idb.cache.teams.put(t);
	}
};

// Top 4 picks have their draft index multiplied by this amount
const DRAFT_LOTTERY_FACTORS = [0, 0.25, 0.5, 0.75];

export const updateLotteryChancesAfterLottery = async (tids: number[]) => {
	for (const [i, tid] of tids.entries()) {
		const factor = DRAFT_LOTTERY_FACTORS[i];
		if (factor === undefined) {
			continue;
		}

		const t = await idb.cache.teams.get(tid);
		if (!t) {
			throw new Error("Should never happen");
		}
		t.cola ??= 0;
		const before = t.cola;
		t.cola = Math.round(t.cola * factor);
		await idb.cache.teams.put(t);

		logChange(
			before,
			t,
			"decreased",
			` due to winning the ${helpers.ordinal(i + 1)} pick`,
		);
	}

	// Reset colaOptOut
	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		if (t.colaOptOut !== undefined) {
			if (t.colaOptOut) {
				t.cola ??= 0;
				const before = t.cola;
				t.cola = Math.max(0, t.cola - COLA_OPT_OUT_PENALTY);

				logChange(before, t, "decreased", " due to opting out of the lottery");
			}

			delete t.colaOptOut;

			await idb.cache.teams.put(t);
		}
	}
};

export const initializeCola = async () => {
	const teams = await idb.cache.teams.getAll();

	// Look back to the past 20 completed seasons
	const season = g.get("season");
	const offset = g.get("phase") <= PHASE.PLAYOFFS ? -1 : 0;
	const seasons = [season - 20 + offset, season + offset] as const;

	const colaByTid: Record<number, number> = {};

	for (const season of range(seasons[0], seasons[1] + 1)) {
		const teamSeasons = await idb.getCopies.teamSeasons(
			{ season },
			"noCopyCache",
		);
		if (teamSeasons.length === 0) {
			// No log of playoff history, so just skip this season
			continue;
		}

		// Increase/decrease based on playoff success
		for (const row of teamSeasons) {
			const t = teams[row.tid]!;
			if (t.disabled) {
				continue;
			}

			let cola = colaByTid[t.tid] ?? 0;

			if (row.playoffRoundsWon < 0) {
				cola += COLA_ALPHA;
			} else {
				const numPlayoffRounds = g.get(
					"numGamesPlayoffSeries",
					row.season,
				).length;
				const offset = numPlayoffRounds - PLAYOFF_FACTORS.length + 1;
				const factor = PLAYOFF_FACTORS[row.playoffRoundsWon - offset];
				if (factor === undefined) {
					// In the lottery
					cola += COLA_ALPHA;
				} else {
					// In the final 3 rounds of playoffs
					cola = Math.round(cola * factor);
				}
			}

			colaByTid[t.tid] = cola;
		}

		// Decrease based on lotery success
		const players = await idb.getCopies.players(
			{ draftYear: season },
			"noCopyCache",
		);
		for (const p of players) {
			if (p.draft.round === 1 && p.draft.pick <= 4) {
				const factor = DRAFT_LOTTERY_FACTORS[p.draft.pick - 1];
				if (factor === undefined) {
					throw new Error("Should never happen");
				}
				const tid = p.draft.tid;
				colaByTid[tid] ??= 0;
				colaByTid[tid] = Math.round(colaByTid[tid] * factor);
			}
		}
	}

	for (const t of teams) {
		if (t.disabled) {
			continue;
		}

		t.cola = colaByTid[t.tid] ?? 0;
		await idb.cache.teams.put(t);
	}
};

export const disableCola = async () => {
	const teams = await idb.cache.teams.getAll();

	for (const t of teams) {
		if (t.cola !== undefined || t.colaOptOut !== undefined) {
			delete t.cola;
			delete t.colaOptOut;
			await idb.cache.teams.put(t);
		}
	}
};
