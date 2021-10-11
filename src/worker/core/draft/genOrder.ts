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
import { bySport } from "../../../common";
import { league } from "..";

type ReturnVal = DraftLotteryResult & {
	draftType: Exclude<
		DraftType,
		"random" | "noLottery" | "noLotteryReverse" | "freeAgents"
	>;
};

// chances does not have to be the perfect length. If chances is too long for numLotteryTeams, it will be truncated. If it's too short, the last entry will be repeated until it's long enough.
export const getLotteryInfo = (
	draftType: DraftType,
	numLotteryTeams: number,
) => {
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
			chances: [185, 135, 115, 95, 85, 75, 65, 60, 50, 35, 30, 25, 20, 15, 10],
		};
	}

	throw new Error(`Unsupported draft type "${draftType}"`);
};

const LOTTERY_DRAFT_TYPES = [
	"nba1994",
	"nba2019",
	"coinFlip",
	"randomLottery",
	"randomLotteryFirst3",
	"nba1990",
	"nhl2017",
] as const;

export const draftHasLottey = (
	draftType: any,
): draftType is typeof LOTTERY_DRAFT_TYPES[number] => {
	return LOTTERY_DRAFT_TYPES.includes(draftType);
};

const TIEBREAKER_AFTER_FIRST_ROUND = bySport<"swap" | "rotate" | "same">({
	basketball: "swap",
	football: "rotate",
	hockey: "same",
});

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
	draftTypeOverride?: DraftType,
): Promise<ReturnVal | undefined> => {
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

	const { allTeams, teamsByRound, ties } = await getTeamsByRound(
		draftPicksIndexed,
	);
	const firstRoundTeams = teamsByRound[0] ?? [];

	const draftType = draftTypeOverride ?? g.get("draftType");
	const riggedLottery = g.get("godMode") ? g.get("riggedLottery") : undefined;

	// Draft lottery
	const firstN: number[] = [];
	let numLotteryTeams = 0;
	let chances: number[] = [];
	if (draftHasLottey(draftType)) {
		const numPlayoffTeams =
			2 ** g.get("numGamesPlayoffSeries", "current").length -
			g.get("numPlayoffByes", "current");

		const info = getLotteryInfo(
			draftType,
			firstRoundTeams.length - numPlayoffTeams,
		);
		const minNumLotteryTeams = info.minNumTeams;
		const numToPick = info.numToPick;
		chances = info.chances;

		if (firstRoundTeams.length < minNumLotteryTeams) {
			const error = new Error(
				`Number of teams with draft picks (${firstRoundTeams.length}) is less than the minimum required for draft type "${draftType}"`,
			);
			(error as any).notEnoughTeams = true;
			throw error;
		}

		numLotteryTeams = helpers.bound(
			firstRoundTeams.length - numPlayoffTeams,
			minNumLotteryTeams,
			draftType === "coinFlip" ? minNumLotteryTeams : firstRoundTeams.length,
		);

		if (numLotteryTeams < chances.length) {
			chances = chances.slice(0, numLotteryTeams);
		} else {
			while (numLotteryTeams > chances.length) {
				chances.push(chances.at(-1));
			}
		}

		if (draftType.startsWith("nba")) {
			divideChancesOverTiedTeams(chances, firstRoundTeams, true);
		}

		const chanceTotal = chances.reduce((a, b) => a + b, 0);
		const chancePct = chances.map(c => (c / chanceTotal) * 100);

		// Idenfity chances indexes protected by riggedLottery, and set to 0 in chancesCumsum
		const riggedLotteryIndexes = riggedLottery
			? riggedLottery.map(dpid => {
					if (typeof dpid === "number") {
						const originalTid = draftPicks.find(dp => {
							return dp.dpid === dpid;
						})?.originalTid;
						if (originalTid !== undefined) {
							const index = firstRoundTeams.findIndex(
								({ tid }) => tid === originalTid,
							);
							if (index >= 0) {
								return index;
							}
						}
					}

					return null;
			  })
			: undefined;

		const chancesCumsum = chances.slice();
		if (riggedLotteryIndexes?.includes(0)) {
			chancesCumsum[0] = 0;
		}
		for (let i = 1; i < chancesCumsum.length; i++) {
			if (riggedLotteryIndexes?.includes(i)) {
				chancesCumsum[i] = chancesCumsum[i - 1];
			} else {
				chancesCumsum[i] += chancesCumsum[i - 1];
			}
		}

		const totalChances = chancesCumsum.at(-1);

		// Pick first 3 or 4 picks based on chancesCumsum
		let iterations = 0;
		while (firstN.length < numToPick) {
			if (riggedLotteryIndexes) {
				const index = riggedLotteryIndexes[firstN.length];
				if (typeof index === "number") {
					firstN.push(index);
					continue;
				}
			}

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
	} else {
		for (const roundTeams of teamsByRound) {
			if (draftType === "random") {
				random.shuffle(roundTeams);
			} else if (draftType === "noLotteryReverse") {
				roundTeams.reverse();
			}
		}
	}

	const firstRoundOrderAfterLottery = [];

	// First round - lottery winners
	let pick = 1;
	for (let i = 0; i < firstN.length; i++) {
		const dp = draftPicksIndexed[firstRoundTeams[firstN[i]].tid][1];

		if (dp !== undefined) {
			dp.pick = pick;
			firstRoundOrderAfterLottery.push(firstRoundTeams[firstN[i]]);

			if (!mock) {
				logLotteryWinners(
					firstRoundTeams,
					dp.tid,
					firstRoundTeams[firstN[i]].tid,
					pick,
					conditions,
				);
			}

			pick += 1;
		}
	}

	// First round - everyone else
	for (let i = 0; i < firstRoundTeams.length; i++) {
		if (!firstN.includes(i)) {
			const dp = draftPicksIndexed[firstRoundTeams[i].tid]?.[1];

			if (dp) {
				dp.pick = pick;
				firstRoundOrderAfterLottery.push(firstRoundTeams[i]);

				if (pick <= numLotteryTeams && !mock) {
					logLotteryWinners(
						firstRoundTeams,
						dp.tid,
						firstRoundTeams[i].tid,
						pick,
						conditions,
					);
				}

				pick += 1;
			}
		}
	}

	let draftLotteryResult: ReturnVal | undefined;
	if (draftHasLottey(draftType)) {
		const usePts = g.get("pointsFormula", "current") !== "";

		// Save draft lottery results separately
		draftLotteryResult = {
			season: g.get("season"),
			draftType,
			rigged: riggedLottery,
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
					const t = allTeams.find(t2 => t2.tid === dp.tid);
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
							pts = t.seasonAttrs.pts;
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
						dpid: dp.dpid,
					};
				}),
		};

		if (!mock) {
			await idb.cache.draftLotteryResults.put(draftLotteryResult);
			await league.setGameAttributes({
				riggedLottery: undefined,
			});
		}
	}

	for (let roundIndex = 1; roundIndex < teamsByRound.length; roundIndex++) {
		const roundTeams = teamsByRound[roundIndex];
		const round = roundIndex + 1;

		// Handle tiebreakers for the 2nd+ round (1st is already done by getTeamsByRound, but 2nd can't be done until now because it depends on lottery results for basketball/football)
		// Skip random drafts because this code assumes teams appear in the same order every round, which is not true there!
		if (draftType !== "random" && TIEBREAKER_AFTER_FIRST_ROUND !== "same") {
			for (const { rounds, teams } of Object.values(ties)) {
				if (rounds.includes(round)) {
					// From getTeamsByRound, teams is guaranteed to be a continuous section of roundTeams, so we can just figure out the correct order for them and then replace them in roundTeam
					const start = roundTeams.findIndex(t => teams.includes(t));
					const length = teams.length;

					const firstRoundOrder = firstRoundOrderAfterLottery.filter(t =>
						teams.includes(t),
					);

					// Handle case where a team did not appear in the 1st round but does now, which probably never happens
					for (const t of teams) {
						if (!firstRoundOrder.includes(t)) {
							firstRoundOrder.push(t);
						}
					}

					// Based on roundIndex and TIEBREAKER_AFTER_FIRST_ROUND, do some permutation of firstRoundOrder
					const newOrder = firstRoundOrder;
					if (TIEBREAKER_AFTER_FIRST_ROUND === "swap") {
						if (roundIndex % 2 === 1) {
							newOrder.reverse();
						}
					} else if (TIEBREAKER_AFTER_FIRST_ROUND === "rotate") {
						for (let i = 0; i < roundIndex; i++) {
							// Move 1st team to the end of the list
							newOrder.push((newOrder as unknown as any).shift());
						}
					}
					roundTeams.splice(start, length, ...newOrder);
				}
			}
		}

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

		await league.setGameAttributes({
			numDraftPicksCurrent: draftPicks.length,
		});
	}

	return draftLotteryResult;
};

export default genOrder;
