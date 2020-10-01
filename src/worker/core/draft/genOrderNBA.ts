import genPicks from "./genPicks";
import logLotteryChances from "./logLotteryChances";
import logLotteryWinners from "./logLotteryWinners";
import lotterySort from "./lotterySort";
import updateChances from "./updateChances";
import { idb } from "../../db";
import { g, helpers, random } from "../../util";
import type {
	Conditions,
	DraftLotteryResult,
	DraftType,
	DraftPickWithoutKey,
} from "../../../common/types";
import genOrderGetPicks from "./genOrderGetPicks";

type ReturnVal = DraftLotteryResult & {
	draftType: Exclude<
		DraftType,
		"random" | "noLottery" | "noLotteryReverse" | "freeAgents"
	>;
};

// chances does not have to be the perfect length. If chances is too long for numLotteryTeams, it will be truncated. If it's too short, the last entry will be repeated until it's long enough.
const getLotteryInfo = (draftType: DraftType, numLotteryTeams: number) => {
	if (draftType === "coinFlip") {
		return {
			minNumTeams: 2,
			numToPick: 2,
			chances: [1, 1, 0],
		};
	}

	if (draftType === "randomLottery") {
		return {
			minNumTeams: numLotteryTeams,
			numToPick: numLotteryTeams,
			chances: [1],
		};
	}

	if (draftType === "randomLotteryFirst3") {
		return {
			minNumTeams: 3,
			numToPick: 3,
			chances: [1],
		};
	}

	if (draftType === "nba1990") {
		const chances = [];
		for (let i = numLotteryTeams; i > 0; i--) {
			chances.push(i);
		}

		return {
			minNumTeams: 3,
			numToPick: 3,
			chances,
		};
	}

	if (draftType === "nba1994") {
		return {
			minNumTeams: 3,
			numToPick: 3,
			chances: [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5],
		};
	}

	if (draftType === "nba2019") {
		return {
			minNumTeams: 4,
			numToPick: 4,
			chances: [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5],
		};
	}

	throw new Error(`Unsupported draft type "${draftType}"`);
};

const VALID_DRAFT_TYPES = [
	"nba1994",
	"nba2019",
	"coinFlip",
	"randomLottery",
	"randomLotteryFirst3",
	"nba1990",
] as const;

/**
 * Sets draft order and save it to the draftPicks object store.
 *
 * This is currently based on an NBA-like lottery, where the first 3 picks can be any of the non-playoff teams (with weighted probabilities).
 *
 * If mock is true, then nothing is actually saved to the database and no notifications are sent
 *
 * @memberOf core.draft
 * @return {Promise}
 */
const genOrder = async (
	mock: boolean = false,
	conditions?: Conditions,
): Promise<ReturnVal> => {
	let teams = await idb.getCopies.teamsPlus({
		attrs: ["tid", "disabled"],
		seasonAttrs: [
			"winp",
			"playoffRoundsWon",
			"won",
			"lost",
			"tied",
			"cid",
			"did",
		],
		season: g.get("season"),
		addDummySeason: true,
		active: true,
	});

	// Sometimes picks just fail to generate or get lost. For example, if numSeasonsFutureDraftPicks is 0.
	await genPicks();

	const draftPicks = await genOrderGetPicks(mock);

	const draftPicksIndexed: DraftPickWithoutKey[][] = [];
	for (const dp of draftPicks) {
		const tid = dp.originalTid; // Initialize to an array

		if (draftPicksIndexed[tid] === undefined) {
			draftPicksIndexed[tid] = [];
		}

		draftPicksIndexed[tid][dp.round] = dp;
	}

	// Handle teams without draft picks (for challengeNoDraftPicks)
	teams = teams.filter(t => !!draftPicksIndexed[t.tid]);

	// Draft lottery

	const draftTypeTemp: any = g.get("draftType");
	if (!VALID_DRAFT_TYPES.includes(draftTypeTemp)) {
		throw new Error(`Unsupported draft type "${draftTypeTemp}"`);
	}
	const draftType = draftTypeTemp as typeof VALID_DRAFT_TYPES[number];

	const numPlayoffTeams =
		2 ** g.get("numGamesPlayoffSeries", "current").length -
		g.get("numPlayoffByes", "current");

	const info = getLotteryInfo(draftType, teams.length - numPlayoffTeams);
	const minNumLotteryTeams = info.minNumTeams;
	const numToPick = info.numToPick;
	let chances = info.chances;

	if (teams.length < minNumLotteryTeams) {
		const error = new Error(
			`Number of teams with draft picks (${teams.length}) is less than the minimum required for draft type "${draftType}"`,
		);
		(error as any).notEnoughTeams = true;
		throw error;
	}

	lotterySort(teams);

	const numLotteryTeams = helpers.bound(
		teams.length - numPlayoffTeams,
		minNumLotteryTeams,
		draftType === "coinFlip" ? minNumLotteryTeams : teams.length,
	);

	if (numLotteryTeams < chances.length) {
		chances = chances.slice(0, numLotteryTeams);
	} else {
		while (numLotteryTeams > chances.length) {
			chances.push(chances[chances.length - 1]);
		}
	}

	updateChances(chances, teams, true);
	const chanceTotal = chances.reduce((a, b) => a + b, 0);
	const chancePct = chances.map(c => (c / chanceTotal) * 100); // cumsum

	const chancesCumsum = chances.slice();

	for (let i = 1; i < chancesCumsum.length; i++) {
		chancesCumsum[i] += chancesCumsum[i - 1];
	}

	const totalChances = chancesCumsum[chancesCumsum.length - 1]; // Pick first 3 or 4 picks based on chancesCumsum

	const firstN: number[] = [];

	let iterations = 0;
	while (firstN.length < numToPick) {
		const draw = random.randInt(0, totalChances - 1);
		const i = chancesCumsum.findIndex(chance => chance > draw);

		if (
			!firstN.includes(i) &&
			i < teams.length &&
			draftPicksIndexed[teams[i].tid]
		) {
			// If one lottery winner, select after other tied teams;
			(teams[i] as any).randVal -= teams.length;
			firstN.push(i);
		}

		iterations += 1;
		if (iterations > 100000) {
			break;
		}
	}

	if (!mock) {
		logLotteryChances(chancePct, teams, draftPicksIndexed, conditions);
	}

	// First round - lottery winners
	let pick = 1;
	for (let i = 0; i < firstN.length; i++) {
		const dp = draftPicksIndexed[teams[firstN[i]].tid][1];

		if (dp !== undefined) {
			dp.pick = pick;
			pick += 1;

			if (!mock) {
				logLotteryWinners(
					teams,
					dp.tid,
					teams[firstN[i]].tid,
					i + 1,
					conditions,
				);
			}
		}
	}

	// First round - everyone else
	for (let i = 0; i < teams.length; i++) {
		if (!firstN.includes(i)) {
			const dp = draftPicksIndexed[teams[i].tid]?.[1];

			if (dp) {
				dp.pick = pick;
				pick += 1;

				if (pick <= numLotteryTeams && !mock) {
					logLotteryWinners(teams, dp.tid, teams[i].tid, pick, conditions);
				}
			}
		}
	}

	// Save draft lottery results separately
	const draftLotteryResult: ReturnVal = {
		season: g.get("season"),
		draftType,
		result: teams // Start with teams in lottery order
			.map(({ tid }) => {
				return draftPicks.find(dp => {
					// Keep only lottery picks
					return (
						dp.originalTid === tid &&
						dp.round === 1 &&
						dp.pick > 0 &&
						dp.pick <= chances.length
					);
				});
			})
			.filter(dp => dp !== undefined) // Keep only lottery picks
			.map(dp => {
				if (dp === undefined) {
					throw new Error("Should never happen");
				}

				// For the team making the pick
				const t = teams.find(t2 => t2.tid === dp.tid);
				let won = 0;
				let lost = 0;
				let tied = 0;

				if (t) {
					won = t.seasonAttrs.won;
					lost = t.seasonAttrs.lost;
					tied = t.seasonAttrs.tied;
				}

				// For the original team
				const i = teams.findIndex(t2 => t2.tid === dp.originalTid);
				return {
					tid: dp.tid,
					originalTid: dp.originalTid,
					chances: chances[i],
					pick: dp.pick,
					won,
					lost,
					tied,
				};
			}),
	};

	if (!mock) {
		await idb.cache.draftLotteryResults.put(draftLotteryResult);
	}

	// Sort by winp with reverse randVal for tiebreakers.
	teams.sort((a, b) => {
		const r = a.seasonAttrs.winp - b.seasonAttrs.winp;
		return r === 0 ? (b as any).randVal - (a as any).randVal : r;
	});

	// Second+ round
	for (let round = 2; round <= g.get("numDraftRounds"); round++) {
		let pick = 1;
		for (let i = 0; i < teams.length; i++) {
			const dp = draftPicksIndexed[teams[i].tid]?.[round];

			if (dp !== undefined) {
				dp.pick = pick;
				pick += 1;
			}
		}
	}

	if (!mock) {
		for (const dp of draftPicks) {
			await idb.cache.draftPicks.put(dp);
		}
	}

	return draftLotteryResult;
};

export default genOrder;
