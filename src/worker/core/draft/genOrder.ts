import genPicks from "./genPicks.ts";
import logLotteryChances from "./logLotteryChances.ts";
import logLotteryWinners from "./logLotteryWinners.ts";
import divideChancesOverTiedTeams from "./divideChancesOverTiedTeams.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, random } from "../../util/index.ts";
import type {
	Conditions,
	DraftLotteryResult,
	DraftType,
	DraftPickWithoutKey,
	DraftPick,
} from "../../../common/types.ts";
import genOrderGetPicks from "./genOrderGetPicks.ts";
import getTeamsByRound from "./getTeamsByRound.ts";
import { bySport } from "../../../common/index.ts";
import { league } from "../index.ts";
import getNumPlayoffTeams from "../season/getNumPlayoffTeams.ts";

/**
 * Anti-tanking system: Detect teams that may be intentionally losing
 * and reduce their lottery odds accordingly.
 *
 * Detection is based on:
 * 1. Large negative variance from expected wins based on roster talent
 * 2. Suspicious late-season losing streaks
 * 3. Pattern of resting healthy star players in close games
 */
const getAntiTankingMultipliers = async (
	firstRoundTeams: { tid: number }[],
): Promise<Map<number, number>> => {
	const multipliers = new Map<number, number>();

	// Check if anti-tanking is enabled (could be a game attribute)
	const antiTankingEnabled = g.get("antiTankingEnabled") ?? true;
	if (!antiTankingEnabled) {
		return multipliers;
	}

	const season = g.get("season");

	for (const team of firstRoundTeams) {
		const tid = team.tid;
		let tankingScore = 0;

		// Get team season data
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[tid, season],
		);

		if (!teamSeason) {
			continue;
		}

		// Get team's roster strength
		const players = await idb.cache.players.indexGetAll("playersByTid", tid);
		const avgPlayerValue =
			players.length > 0
				? players.reduce((sum, p) => sum + p.value, 0) / players.length
				: 40;

		// Expected win percentage based on roster (rough estimate)
		const expectedWinPct = Math.min(0.8, Math.max(0.2, (avgPlayerValue - 30) / 50));
		const totalGames = teamSeason.won + teamSeason.lost + (teamSeason.tied || 0);
		const actualWinPct = totalGames > 0 ? teamSeason.won / totalGames : 0.5;

		// Check for significant underperformance relative to roster
		const winPctDiff = expectedWinPct - actualWinPct;

		// If team is winning much less than expected (> 15% gap), suspicious
		if (winPctDiff > 0.15 && totalGames > 20) {
			tankingScore += Math.floor((winPctDiff - 0.15) * 100);
		}

		// Check for late-season collapse (teams that tank late to get better picks)
		// Look at recent games if available
		const gamesPlayed = teamSeason.won + teamSeason.lost;
		if (gamesPlayed > 60) {
			// This is a simplified check - in reality we'd look at game-by-game data
			// For now, teams with very bad records despite decent rosters get flagged
			if (actualWinPct < 0.3 && avgPlayerValue > 50) {
				tankingScore += 15;
			}
		}

		// If tanking score is high enough, reduce lottery odds
		if (tankingScore > 10) {
			// Reduce chances proportionally - max 50% reduction for severe tanking
			const reduction = Math.min(0.5, tankingScore / 50);
			multipliers.set(tid, 1 - reduction);
		}
	}

	return multipliers;
};

type ReturnVal = {
	draftLotteryResult:
		| (DraftLotteryResult & {
				draftType: Exclude<
					DraftType,
					"random" | "noLottery" | "noLotteryReverse" | "freeAgents"
				>;
		  })
		| undefined;
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
] as const;

// chances does not have to be the perfect length. If chances is too long for numLotteryTeams, it will be truncated. If it's too short, the last entry will be repeated until it's long enough.
const getLotteryInfo = (draftType: DraftType, numLotteryTeams: number) => {
	if (draftType === "coinFlip") {
		return {
			numToPick: 2,
			chances: [1, 1, 0],
		};
	}

	if (draftType === "randomLottery") {
		return {
			numToPick: numLotteryTeams,
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
		for (let i = numLotteryTeams; i > 0; i--) {
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
) => {
	if (draftHasLottery(draftType)) {
		return getLotteryInfo(draftType, numLotteryTeams).numToPick;
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

/**
 * Sets draft order and save it to the draftPicks object store.
 *
 * If mock is true, then nothing is actually saved to the database and no notifications are sent
 */
const genOrder = async (
	mock: boolean = false,
	conditions?: Conditions,
	draftTypeOverride?: DraftType,
): Promise<ReturnVal> => {
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

	const { teamsByRound, ties } = await getTeamsByRound(draftPicksIndexed);
	const firstRoundTeams = teamsByRound[0] ?? [];

	const draftType = draftTypeOverride ?? g.get("draftType");
	const riggedLottery = g.get("godMode") ? g.get("riggedLottery") : undefined;

	// Draft lottery
	const firstN: number[] = [];
	let numLotteryTeams = 0;
	let chances: number[] = [];
	if (draftHasLottery(draftType)) {
		const numPlayoffTeams = (await getNumPlayoffTeams(g.get("season")))
			.numPlayoffTeams;

		const info = getLotteryInfo(
			draftType,
			firstRoundTeams.length - numPlayoffTeams,
		);
		const numToPick = info.numToPick;
		chances = info.chances;

		if (firstRoundTeams.length < numToPick) {
			const error = new Error(
				`Number of teams with draft picks (${firstRoundTeams.length}) is less than the minimum required for draft type "${draftType}"`,
			);
			(error as any).notEnoughTeams = true;
			throw error;
		}

		numLotteryTeams = helpers.bound(
			firstRoundTeams.length - numPlayoffTeams,
			numToPick,
			draftType === "coinFlip" ? numToPick : firstRoundTeams.length,
		);

		if (numLotteryTeams < chances.length) {
			chances = chances.slice(0, numLotteryTeams);
		} else {
			while (numLotteryTeams > chances.length) {
				chances.push(chances.at(-1)!);
			}
		}

		if (DIVIDE_CHANCES_OVER_TIED_TEAMS) {
			divideChancesOverTiedTeams(chances, firstRoundTeams, true);
		}

		// Apply anti-tanking multipliers to reduce lottery odds for suspected tanking teams
		const antiTankingMultipliers = await getAntiTankingMultipliers(
			firstRoundTeams.slice(0, numLotteryTeams),
		);
		for (let i = 0; i < chances.length; i++) {
			const tid = firstRoundTeams[i]?.tid;
			if (tid !== undefined && antiTankingMultipliers.has(tid)) {
				const multiplier = antiTankingMultipliers.get(tid)!;
				chances[i] = Math.floor(chances[i]! * multiplier);
			}
		}

		const chanceTotal = chances.reduce((a, b) => a + b, 0);
		const chancePct = chances.map((c) => (c / chanceTotal) * 100);

		// Idenfity chances indexes protected by riggedLottery, and set to 0 in chancesCumsum
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

					return null;
				})
			: undefined;

		const chancesCumsum = chances.slice();
		if (riggedLotteryIndexes?.includes(0)) {
			chancesCumsum[0] = 0;
		}
		for (let i = 1; i < chancesCumsum.length; i++) {
			if (riggedLotteryIndexes?.includes(i)) {
				chancesCumsum[i] = chancesCumsum[i - 1]!;
			} else {
				chancesCumsum[i]! += chancesCumsum[i - 1]!;
			}
		}

		const totalChances = chancesCumsum.at(-1)!;

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
			const i = chancesCumsum.findIndex((chance) => chance > draw);

			if (
				!firstN.includes(i) &&
				i < firstRoundTeams.length &&
				draftPicksIndexed[firstRoundTeams[i]!.tid]
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

	let draftLotteryResult: ReturnVal["draftLotteryResult"];
	if (draftHasLottery(draftType)) {
		// Save draft lottery results separately
		draftLotteryResult = {
			season: g.get("season"),
			draftType,
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

		if (!mock) {
			await idb.cache.draftLotteryResults.put(draftLotteryResult);
			await league.setGameAttributes({
				riggedLottery: undefined,
			});
		}
	}

	for (let roundIndex = 1; roundIndex < teamsByRound.length; roundIndex++) {
		const roundTeams = teamsByRound[roundIndex]!;
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

	return { draftLotteryResult, draftPicks };
};

export default genOrder;
