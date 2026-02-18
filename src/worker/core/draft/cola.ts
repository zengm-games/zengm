import { COLA_ALPHA, COLA_OPT_OUT_PENALTY } from "../../../common/constants.ts";
import type { Team } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";
import helpers from "../../util/helpers.ts";
import logEvent from "../../util/logEvent.ts";
import getNumPlayoffTeams from "../season/getNumPlayoffTeams.ts";
import genOrder from "./genOrder.ts";

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

const logDecrease = (before: number, t: Team) => {
	const text = `The lottery chances for the <a href="${helpers.leagueUrl([
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

// Champion gets their lottery chances multiplied by 0. Loser of the finals, 0.25. Loser of the semifinals, 0.5. Loser of the quarterfinals, 0.75.
const PLAYOFF_FACTORS = [0.75, 0.5, 0.25, 0];

const decreaseLotteryIndexesAfterPlayoffs = async () => {
	const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;

	// Add this to playoffRoundsWon and we can index into PLAYOFF_FACTORS
	const offset = numPlayoffRounds - PLAYOFF_FACTORS.length + 1;

	const teamSeasons = await idb.getCopies.teamSeasons(
		{ season: g.get("season") },
		"noCopyCache",
	);
	for (const row of teamSeasons) {
		if (row.playoffRoundsWon < 0) {
			continue;
		}
		const factor = PLAYOFF_FACTORS[row.playoffRoundsWon - offset];
		if (factor !== undefined) {
			const t = await idb.cache.teams.get(row.tid);
			if (!t) {
				throw new Error("Should never happen");
			}
			t.cola ??= 0;
			const before = t.cola;
			t.cola = Math.round(t.cola * factor);
			await idb.cache.teams.put(t);

			logDecrease(before, t);
		}
	}
};

const increaseLotteryIndexesAfterPlayoffs = async () => {
	const { draftLotteryResult } = await genOrder(true);
	if (!draftLotteryResult) {
		throw new Error("Should never happen");
	}

	for (const row of draftLotteryResult.result) {
		const t = await idb.cache.teams.get(row.originalTid);
		if (!t) {
			throw new Error("Should never happen");
		}
		t.cola ??= 0;
		const before = t.cola;
		t.cola += COLA_ALPHA;
		await idb.cache.teams.put(t);

		const text = `The lottery chances for the <a href="${helpers.leagueUrl([
			"roster",
			`${t.abbrev}_${t.tid}`,
			g.get("season"),
		])}">${t.name}</a> increased from ${before} to ${t.cola}.`;

		logEvent({
			type: "draftLottery",
			text,
			showNotification: false,
			pids: [],
			tids: [t.tid],
			score: 0,
		});
	}
};

// Call this at the end of the playoffs
export const updateLotteryIndexesAfterPlayoffs = async () => {
	if (g.get("draftType") !== "cola") {
		return;
	}

	await increaseLotteryIndexesAfterPlayoffs();
	await decreaseLotteryIndexesAfterPlayoffs();
};

// Top 4 picks have their draft index multiplied by this amount
const DRAFT_LOTTERY_FACTORS = [0, 0.25, 0.5, 0.75];

export const updateLotteryIndexesAfterLottery = async (tids: number[]) => {
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

		const text = `The lottery chances for the <a href="${helpers.leagueUrl([
			"roster",
			`${t.abbrev}_${t.tid}`,
			g.get("season"),
		])}">${t.name}</a> decreased from ${before} to ${t.cola} due to winning the ${helpers.ordinal(i + 1)} pick.`;

		logEvent({
			type: "draftLottery",
			text,
			showNotification: false,
			pids: [],
			tids: [t.tid],
			score: 0,
		});
	}

	// Reset colaOptOut
	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		if (t.colaOptOut !== undefined) {
			if (t.colaOptOut) {
				t.cola ??= 0;
				const before = t.cola;
				t.cola = Math.max(0, t.cola - COLA_OPT_OUT_PENALTY);

				const text = `The lottery chances for the <a href="${helpers.leagueUrl([
					"roster",
					`${t.abbrev}_${t.tid}`,
					g.get("season"),
				])}">${t.name}</a> decreased from ${before} to ${t.cola} due to opting out of the lottery.`;

				logEvent({
					type: "draftLottery",
					text,
					showNotification: false,
					pids: [],
					tids: [t.tid],
					score: 0,
				});
			}

			delete t.colaOptOut;

			await idb.cache.teams.put(t);
		}
	}
};
