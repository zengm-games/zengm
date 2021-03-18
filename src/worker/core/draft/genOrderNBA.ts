import genPicks from "./genPicks";
import logLotteryChances from "./logLotteryChances";
import logLotteryWinners from "./logLotteryWinners";
import divideChancesOverTiedTeams from "./divideChancesOverTiedTeams";
import { idb } from "../../db";
import { g, helpers, random } from "../../util";
import type {
	Conditions,
	DraftLotteryResult,
	DraftType,
	DraftPickWithoutKey,
} from "../../../common/types";
import genOrderGetPicks from "./genOrderGetPicks";
import getTeamsByRound from "./getTeamsByRound";
import { team } from "..";
import { isSport } from "../../../common";

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

	if (draftType === "nhl2017") {
		return {
			minNumTeams: 3,
			numToPick: 3,
			chances: [
				185,
				135,
				115,
				95,
				85,
				75,
				65,
				60,
				45,
				35,
				30,
				25,
				20,
				15,
				10,
				5,
			],
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
	"nhl2017",
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

	const teamsByRound = await getTeamsByRound(draftPicksIndexed);
	const firstRoundTeams = teamsByRound[0];

	// Draft lottery

	const draftTypeTemp: any = g.get("draftType");
	if (!VALID_DRAFT_TYPES.includes(draftTypeTemp)) {
		throw new Error(`Unsupported draft type "${draftTypeTemp}"`);
	}
	const draftType = draftTypeTemp as typeof VALID_DRAFT_TYPES[number];

	const numPlayoffTeams =
		2 ** g.get("numGamesPlayoffSeries", "current").length -
		g.get("numPlayoffByes", "current");

	const info = getLotteryInfo(
		draftType,
		firstRoundTeams.length - numPlayoffTeams,
	);
	const minNumLotteryTeams = info.minNumTeams;
	const numToPick = info.numToPick;
	let chances = info.chances;

	if (firstRoundTeams.length < minNumLotteryTeams) {
		const error = new Error(
			`Number of teams with draft picks (${firstRoundTeams.length}) is less than the minimum required for draft type "${draftType}"`,
		);
		(error as any).notEnoughTeams = true;
		throw error;
	}

	const numLotteryTeams = helpers.bound(
		firstRoundTeams.length - numPlayoffTeams,
		minNumLotteryTeams,
		draftType === "coinFlip" ? minNumLotteryTeams : firstRoundTeams.length,
	);

	if (numLotteryTeams < chances.length) {
		chances = chances.slice(0, numLotteryTeams);
	} else {
		while (numLotteryTeams > chances.length) {
			chances.push(chances[chances.length - 1]);
		}
	}

	if (isSport("basketball")) {
		divideChancesOverTiedTeams(chances, firstRoundTeams, true);
	}

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
			i < firstRoundTeams.length &&
			draftPicksIndexed[firstRoundTeams[i].tid]
		) {
			firstN.push(i);
		}

		iterations += 1;
		if (iterations > 100000) {
			break;
		}
	}

	if (!mock) {
		logLotteryChances(
			chancePct,
			firstRoundTeams,
			draftPicksIndexed,
			conditions,
		);
	}

	// First round - lottery winners
	let pick = 1;
	for (let i = 0; i < firstN.length; i++) {
		const dp = draftPicksIndexed[firstRoundTeams[firstN[i]].tid][1];

		if (dp !== undefined) {
			dp.pick = pick;
			pick += 1;

			if (!mock) {
				logLotteryWinners(
					firstRoundTeams,
					dp.tid,
					firstRoundTeams[firstN[i]].tid,
					i + 1,
					conditions,
				);
			}
		}
	}

	// First round - everyone else
	for (let i = 0; i < firstRoundTeams.length; i++) {
		if (!firstN.includes(i)) {
			const dp = draftPicksIndexed[firstRoundTeams[i].tid]?.[1];

			if (dp) {
				dp.pick = pick;
				pick += 1;

				if (pick <= numLotteryTeams && !mock) {
					logLotteryWinners(
						firstRoundTeams,
						dp.tid,
						firstRoundTeams[i].tid,
						pick,
						conditions,
					);
				}
			}
		}
	}

	const usePts = g.get("pointsFormula", "current") !== "";

	// Save draft lottery results separately
	const draftLotteryResult: ReturnVal = {
		season: g.get("season"),
		draftType,
		result: firstRoundTeams // Start with teams in lottery order
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
				const t = firstRoundTeams.find(t2 => t2.tid === dp.tid);
				let won = 0;
				let lost = 0;
				let otl = 0;
				let tied = 0;
				let pts;

				if (t) {
					won = t.seasonAttrs.won;
					lost = t.seasonAttrs.lost;
					otl = t.seasonAttrs.otl;
					tied = t.seasonAttrs.tied;

					if (usePts) {
						pts = team.evaluatePointsFormula(t.seasonAttrs);
					}
				}

				// For the original team
				const i = firstRoundTeams.findIndex(t2 => t2.tid === dp.originalTid);
				return {
					tid: dp.tid,
					originalTid: dp.originalTid,
					chances: chances[i],
					pick: dp.pick,
					won,
					lost,
					otl,
					tied,
					pts,
				};
			}),
	};

	if (!mock) {
		await idb.cache.draftLotteryResults.put(draftLotteryResult);
	}

	for (let roundIndex = 1; roundIndex < teamsByRound.length; roundIndex++) {
		const roundTeams = teamsByRound[roundIndex];
		let pick = 1;
		for (const t of roundTeams) {
			const dp = draftPicksIndexed[t.tid]?.[roundIndex + 1];

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
