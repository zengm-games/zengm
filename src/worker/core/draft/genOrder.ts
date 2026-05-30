import genPicks from "./genPicks.ts";
import logLotteryChances from "./logLotteryChances.ts";
import logLotteryWinners from "./logLotteryWinners.ts";
import divideChancesOverTiedTeams from "./divideChancesOverTiedTeams.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import type {
	Conditions,
	DraftLotteryResult,
	DraftType,
	DraftPickWithoutKey,
	DraftPick,
} from "../../../common/types.ts";
import genOrderGetPicks from "./genOrderGetPicks.ts";
import getTeamsByRound from "./getTeamsByRound.ts";
import { COLA_ALPHA, PHASE } from "../../../common/constants.ts";
import { league } from "../index.ts";
import getNumPlayoffTeams from "../season/getNumPlayoffTeams.ts";
import { getNumColaLotteryTeams, updateColaAfterLottery } from "./cola.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import { shuffle } from "../../../common/random.ts";
import { simLottery } from "./draftLottery.ts";
import { RESTRICTED_5_PICK, updateNba2027AfterLottery } from "./nba2027.ts";
import { orderBy, range } from "../../../common/utils.ts";

type MyDraftLotteryResult<Completed extends boolean> =
	DraftLotteryResult<Completed> & {
		draftType: Exclude<
			DraftType,
			"random" | "noLottery" | "noLotteryReverse" | "freeAgents"
		>;
	};

// The generic and export are because sometimes we want the result of this function to support unrealized picks, like showing an incomplete draft lottery in the UI, and it's just easier to define that type here
export type GenOrderResult<Completed extends boolean> = {
	draftLotteryResult: MyDraftLotteryResult<Completed> | undefined;
	draftPicks: DraftPick[];
};

const LOTTERY_DRAFT_TYPES = [
	"nba1994",
	"nba2019",
	"coinFlip",
	"randomLottery",
	"randomLotteryFirst3",
	"nba1990",
	"nhl2017",
	"nhl2021",
	"mlb2022",
	"custom",
	"cola",
	"nba2027",
] as const;

// chances does not have to be the perfect length. If chances is too long for numNonPlayoffTeams, it will be truncated. If it's too short, the last entry will be repeated until it's long enough.
const getLotteryInfo = (
	draftType: DraftType,
	numNonPlayoffTeams: number,
	numPlayInTeams: number,
) => {
	if (draftType === "coinFlip") {
		return {
			numToPick: 2,
			chances: [1, 1, 0],
		};
	}

	if (draftType === "randomLottery") {
		return {
			numToPick: numNonPlayoffTeams,
			chances: [1],
		};
	}

	if (draftType === "randomLotteryFirst3") {
		return {
			numToPick: 3,
			chances: [1],
		};
	}

	if (draftType === "nba1990") {
		const chances = [];
		for (let i = numNonPlayoffTeams; i > 0; i--) {
			chances.push(i);
		}

		return {
			numToPick: 3,
			chances,
		};
	}

	if (draftType === "nba1994") {
		return {
			numToPick: 3,
			chances: [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5],
		};
	}

	if (draftType === "nba2019") {
		return {
			numToPick: 4,
			chances: [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5],
		};
	}

	if (draftType === "nhl2017") {
		return {
			numToPick: 3,
			chances: [185, 135, 115, 95, 85, 75, 65, 60, 50, 35, 30, 25, 20, 15, 10],
		};
	}

	if (draftType === "nhl2021") {
		return {
			numToPick: 2,
			chances: [
				185, 135, 115, 95, 85, 75, 65, 60, 50, 35, 30, 25, 20, 15, 5, 5,
			],
		};
	}

	if (draftType === "mlb2022") {
		return {
			numToPick: 6,
			chances: [
				1650, 1650, 1650, 1325, 1000, 750, 550, 390, 270, 180, 140, 110, 90, 76,
				62, 48, 36, 23,
			],
		};
	}

	if (draftType === "custom") {
		return {
			numToPick: g.get("draftLotteryCustomNumPicks"),
			chances: [...g.get("draftLotteryCustomChances")],
		};
	}

	if (draftType === "cola") {
		return {
			numToPick: 4,
			chances: [1], // Placeholder, will be filled with real values later
		};
	}

	if (draftType === "nba2027") {
		// Arbitrary value, but should be something I guess
		const MIN_NUM_TEAMS_IN_LOTTERY = 6;

		let numToPick = Math.max(numNonPlayoffTeams, MIN_NUM_TEAMS_IN_LOTTERY);
		const chances: number[] = range(numToPick).map((i) => {
			if (i < 3) {
				// 2 chances for the worst 3 teams
				return 2;
			}

			// 2 chances for the best 2-4 teams, if we have room
			if (numNonPlayoffTeams >= 11) {
				if (i >= numNonPlayoffTeams - 4) {
					return 2;
				}
			} else if (numNonPlayoffTeams >= 9) {
				if (i >= numNonPlayoffTeams - 2) {
					return 2;
				}
			}

			return 3;
		});
		if (numPlayInTeams === 4) {
			// If exactly 4 play-in teams, then 1 ball to each of the 7/8 losers
			numToPick += 2;
			chances.push(1, 1);
		}

		return {
			numToPick,
			chances,
		};
	}

	throw new Error(`Unsupported draft type "${draftType}"`);
};

const draftHasLottery = (
	draftType: any,
): draftType is (typeof LOTTERY_DRAFT_TYPES)[number] => {
	return LOTTERY_DRAFT_TYPES.includes(draftType);
};

export const getNumToPick = (
	draftType: DraftType | "dummy" | undefined,
	numLotteryTeams: number,
	numPlayInTeams: number,
) => {
	if (draftHasLottery(draftType)) {
		return getLotteryInfo(draftType, numLotteryTeams, numPlayInTeams).numToPick;
	}

	return 0;
};

const TIEBREAKER_AFTER_FIRST_ROUND = bySport<"swap" | "rotate" | "same">({
	baseball: "swap", // MLB uses last year's record
	basketball: "swap",
	football: "rotate",
	hockey: "same",
});

const DIVIDE_CHANCES_OVER_TIED_TEAMS = bySport({
	baseball: false,
	basketball: true,
	football: false,
	hockey: false,
});

export class NotEnoughTeamsError extends Error {
	constructor(numFirstRoundTeams: number, draftType: DraftType) {
		super(
			`Number of teams with draft picks (${numFirstRoundTeams}) is less than the minimum required for draft type "${draftType}"`,
		);
		this.name = "NotEnoughTeamsError";
	}
}

/**
 * Sets draft order and save it to the draftPicks object store.
 *
 * If mock is true, then nothing is actually saved to the database and no notifications are sent
 */
const genOrder = async (
	mock: boolean,
	conditions?: Conditions,
	draftTypeOverride?: DraftType,
): Promise<GenOrderResult<true>> => {
	// Sometimes picks just fail to generate or get lost. For example, if numSeasonsFutureDraftPicks is 0.
	await genPicks();

	const draftPicks = await genOrderGetPicks(mock);
	const draftPicksIndexed: DraftPickWithoutKey[][] = [];
	for (const dp of draftPicks) {
		const tid = dp.originalTid;

		// Initialize to an array
		if (draftPicksIndexed[tid] === undefined) {
			draftPicksIndexed[tid] = [];
		}

		draftPicksIndexed[tid][dp.round] = dp;
	}

	const draftType = draftTypeOverride ?? g.get("draftType");
	const riggedLottery = g.get("godMode") ? g.get("riggedLottery") : undefined;

	const { nba2027NumLotteryTeams, teamsByRound, ties } = await getTeamsByRound(
		draftType,
		draftPicksIndexed,
	);
	const firstRoundTeams = teamsByRound[0] ?? [];

	// Draft lottery
	let firstN: number[];
	let numLotteryTeams = 0;
	let chances: number[] = [];
	let nba2027Restrictions: DraftLotteryResult["nba2027"];
	if (draftHasLottery(draftType)) {
		const numPlayoffTeamsInfo = await getNumPlayoffTeams(g.get("season"));
		const numPlayoffTeams = numPlayoffTeamsInfo.numPlayoffTeams;

		const info = getLotteryInfo(
			draftType,
			firstRoundTeams.length - numPlayoffTeams,
			numPlayoffTeamsInfo.numPlayInTeams,
		);
		const numToPick = info.numToPick;

		if (firstRoundTeams.length < numToPick) {
			throw new NotEnoughTeamsError(firstRoundTeams.length, draftType);
		}

		if (draftType === "cola") {
			numLotteryTeams = await getNumColaLotteryTeams();
		} else {
			numLotteryTeams = helpers.bound(
				firstRoundTeams.length - numPlayoffTeams,
				numToPick,
				draftType === "coinFlip" ? numToPick : firstRoundTeams.length,
			);
		}

		const lotteryTeams = firstRoundTeams.slice(0, numLotteryTeams);

		if (draftType === "cola") {
			// If the playoffs aren't over yet, then we haven't yet added COLA_ALPHA to all the lottery teams
			const addAlpha = g.get("phase") <= PHASE.PLAYOFFS ? COLA_ALPHA : 0;

			chances = lotteryTeams.map((t) => {
				// Traded picks are not eligible for the lottery
				const currentTid = draftPicksIndexed[t.tid]?.[1]?.tid;
				if (currentTid !== t.tid) {
					return 0;
				}

				const teamInfo =
					t.draftLottery?.type === "cola" ? t.draftLottery : undefined;

				if (teamInfo?.optOut) {
					return 0;
				}

				return (teamInfo?.chances ?? 0) + addAlpha;
			});
		} else {
			chances = info.chances;

			if (draftType === "nba2027") {
				const restricted1 = [];
				const restricted5 = [];
				for (const [i, t] of lotteryTeams.entries()) {
					if (t.draftLottery?.type === "nba2027") {
						if (t.draftLottery.restricted1) {
							restricted1.push(i);
						}
						if (t.draftLottery.restricted5 === 2) {
							restricted5.push(i);
						}
					}
				}

				nba2027Restrictions = {
					restricted1,
					restricted5,
				};
			}
		}

		if (numLotteryTeams < chances.length) {
			chances = chances.slice(0, numLotteryTeams);
		} else {
			while (numLotteryTeams > chances.length) {
				chances.push(chances.at(-1)!);
			}
		}

		if (
			DIVIDE_CHANCES_OVER_TIED_TEAMS &&
			draftType !== "cola" &&
			draftType !== "nba2027"
		) {
			divideChancesOverTiedTeams(chances, firstRoundTeams, true);
		}

		const chanceTotal = chances.reduce((a, b) => a + b, 0);
		const chancePct = chances.map((c) => (c / chanceTotal) * 100);

		// Idenfity chances indexes protected by riggedLottery
		const riggedLotteryIndexes = riggedLottery
			? riggedLottery.map((dpid) => {
					if (typeof dpid === "number") {
						const originalTid = draftPicks.find((dp) => {
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

					return undefined;
				})
			: undefined;

		// Pick first N picks based on chancesCumsum
		firstN = simLottery(
			draftType,
			chances,
			numToPick,
			nba2027Restrictions,
			riggedLotteryIndexes,
		);

		if (!mock) {
			logLotteryChances(
				chancePct,
				firstRoundTeams,
				draftPicksIndexed,
				conditions,
			);
		}
	} else {
		firstN = [];
		for (const roundTeams of teamsByRound) {
			if (draftType === "random") {
				shuffle(roundTeams);
			} else if (draftType === "noLotteryReverse") {
				roundTeams.reverse();
			}
		}
	}

	const firstRoundOrderAfterLottery = [];

	// First round - lottery winners
	let pick = 1;
	for (let i = 0; i < firstN.length; i++) {
		const t = firstRoundTeams[firstN[i]!]!;
		const dp = draftPicksIndexed[t.tid]![1];

		if (dp !== undefined) {
			dp.pick = pick;
			firstRoundOrderAfterLottery.push(t);

			if (!mock) {
				logLotteryWinners(
					firstRoundTeams,
					dp.tid,
					firstRoundTeams[firstN[i]!]!.tid,
					pick,
					conditions,
				);
			}

			pick += 1;
		}
	}

	if (!mock && draftType === "cola") {
		const tids = firstRoundOrderAfterLottery.map((t) => t.tid);
		await updateColaAfterLottery(tids);
	}

	// First round - everyone else
	for (const [i, t] of firstRoundTeams.entries()) {
		if (!firstN.includes(i)) {
			const dp = draftPicksIndexed[t.tid]?.[1];

			if (dp) {
				dp.pick = pick;
				firstRoundOrderAfterLottery.push(t);

				if (pick <= numLotteryTeams && !mock) {
					logLotteryWinners(firstRoundTeams, dp.tid, t.tid, pick, conditions);
				}

				pick += 1;
			}
		}
	}

	let draftLotteryResult: MyDraftLotteryResult<true> | undefined;
	if (draftHasLottery(draftType)) {
		const common = {
			season: g.get("season"),
			rigged: riggedLottery,
			result: firstRoundTeams // Start with teams in lottery order
				.map(({ tid }) => {
					return draftPicks.find((dp) => {
						// Keep only lottery picks
						return (
							dp.originalTid === tid &&
							dp.round === 1 &&
							dp.pick > 0 &&
							dp.pick <= chances.length
						);
					});
				})
				.filter((dp) => dp !== undefined) // Keep only lottery picks
				.map((dp) => {
					if (dp === undefined) {
						throw new Error("Should never happen");
					}

					// For the original team
					const i = firstRoundTeams.findIndex(
						(t2) => t2.tid === dp.originalTid,
					);

					return {
						tid: dp.tid,
						originalTid: dp.originalTid,
						chances: chances[i]!,
						pick: dp.pick,
						dpid: dp.dpid,
					};
				}),
		};

		if (draftType === "nba2027") {
			if (!nba2027Restrictions) {
				throw new Error("Should never happen");
			}
			draftLotteryResult = {
				...common,
				draftType,
				nba2027: nba2027Restrictions,
			};
		} else {
			draftLotteryResult = {
				...common,
				draftType,
			};
		}

		if (!mock) {
			await idb.cache.draftLotteryResults.put(draftLotteryResult);
			await league.setGameAttributes({
				riggedLottery: undefined,
			});

			if (draftType === "nba2027") {
				const tids = orderBy(
					draftLotteryResult.result.filter(
						(row) => row.pick <= RESTRICTED_5_PICK,
					),
					"pick",
					"asc",
				).map((row) => row.originalTid);
				await updateNba2027AfterLottery(tids);
			}
		}
	}

	for (let roundIndex = 1; roundIndex < teamsByRound.length; roundIndex++) {
		let roundTeams = teamsByRound[roundIndex]!;
		const round = roundIndex + 1;

		// Handle tiebreakers for the 2nd+ round (1st is already done by getTeamsByRound, but 2nd can't be done until now because it depends on lottery results for basketball/football)
		// Skip random drafts because this code assumes teams appear in the same order every round, which is not true there!
		if (draftType !== "random" && TIEBREAKER_AFTER_FIRST_ROUND !== "same") {
			for (const { rounds, teams } of Object.values(ties)) {
				if (rounds.includes(round)) {
					// From getTeamsByRound, teams is guaranteed to be a continuous section of roundTeams, so we can just figure out the correct order for them and then replace them in roundTeam
					const start = roundTeams.findIndex((t) => teams.includes(t));
					const length = teams.length;

					const firstRoundOrder = firstRoundOrderAfterLottery.filter((t) =>
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
							const firstTeam = newOrder.shift();
							if (firstTeam) {
								newOrder.push(firstTeam);
							}
						}
					}
					roundTeams.splice(start, length, ...newOrder);
				}
			}
		}

		if (draftType === "nba2027") {
			// 2nd+ round, non-playoff teams are reverse of the first round
			const firstRound = teamsByRound[0]!;
			roundTeams = [
				...firstRound.slice(0, nba2027NumLotteryTeams).reverse(),
				...roundTeams.slice(nba2027NumLotteryTeams),
			];
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

	return { draftLotteryResult, draftPicks };
};

export default genOrder;
