import { PHASE } from "../../../common/constants.ts";
import { draft, player, team, trade } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local } from "../../util/index.ts";
import type {
	TradePickValues,
	PlayerContract,
	PlayerInjury,
	DraftPick,
	Team,
} from "../../../common/types.ts";
import { getNumPicksPerRound } from "../trade/getPickValues.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import { groupByUnique, last } from "../../../common/utils.ts";
import {
	getNumToPick,
	getRoundOrderRule,
	NotEnoughTeamsError,
} from "../draft/genOrder.ts";
import getNumPlayoffTeams from "../season/getNumPlayoffTeams.ts";
import {
	getDraftLotteryProbsCached,
	getFirstRoundSlotProbsCached,
	getSlotPickProbsCached,
	type ProjectedTeam,
} from "./pickProbsCache.ts";
import type { TeamSeasonRecord } from "./getHypotheticalTeam.ts";

type Asset =
	| {
			type: "player";
			value: number;
			contractValue: number;
			injury: PlayerInjury;
			age: number;
			justDrafted: boolean;
	  }
	| {
			type: "pick";
			value: number;
			contractValue: number;
			injury: PlayerInjury;
			age: number;
			dp: DraftPick;
			draftPick: number;
			draftYear: number;
	  };

const zscore = (value: number) =>
	(value - local.playerOvrMean) / local.playerOvrStd;

const ovrIndexToEstWinPercent = (teamOvrIndex: number) => {
	return (
		0.25 +
		(0.5 * (g.get("numActiveTeams") - 1 - teamOvrIndex)) /
			(g.get("numActiveTeams") - 1)
	);
};

// After the regular season, rosters keep changing but the record doesn't, so it says less about how good a team will be in future seasons
const OFFSEASON_RECORD_WEIGHT = 0.25;

// Weighted average of current season record and team rating, based on how much of the current season is complete. futureDraft means this is for a draft after the current season's draft
const getEstWinPercent = ({
	futureDraft,
	teamOvrWinp,
	teamSeason,
}: {
	futureDraft: boolean;
	teamOvrWinp: number;
	teamSeason:
		| {
				won: number;
				lost: number;
				tied: number;
				otl: number;
		  }
		| undefined;
}) => {
	const gp = teamSeason ? helpers.getTeamSeasonGp(teamSeason) : 0;

	if (!teamSeason || gp === 0) {
		// Expansion team?
		return teamOvrWinp;
	}

	let recordWeight = helpers.bound(gp / g.get("numGames"), 0, 1);
	if (futureDraft && g.get("phase") > PHASE.PLAYOFFS) {
		recordWeight = Math.min(recordWeight, OFFSEASON_RECORD_WEIGHT);
	}

	return (
		recordWeight * helpers.calcWinp(teamSeason) +
		(1 - recordWeight) * teamOvrWinp
	);
};

// Uncertainty (standard deviation) in how good a team really is, in units of winning percentage. These are just rough guesses! Uncertainty from the randomness of individual games is handled separately.
const TEAM_QUALITY_STD_CURRENT_SEASON = 0.05;
const TEAM_QUALITY_STD_FUTURE_SEASON = 0.1;

// What the simulation in getFirstRoundSlotProbs needs to know about a team: the results of games already played, how many games are left, and how we expect it to do in those games. Early in the season anything can happen. Late in the season there are few games left to change things, and some things can't change at all, like if a team has already clinched a playoff spot.
const getProjectedTeam = ({
	futureDraft,
	noDraftPick,
	t,
	teamOvrWinp,
	teamSeason,
	wp,
}: {
	futureDraft: boolean;
	noDraftPick: boolean;
	t: Pick<Team, "tid" | "cid" | "did">;
	teamOvrWinp: number;
	teamSeason: TeamSeasonRecord | undefined;
	wp: number;
}): ProjectedTeam => {
	// For a future draft, the whole season is left to play
	const currentTeamSeason = futureDraft ? undefined : teamSeason;
	const gp = currentTeamSeason ? helpers.getTeamSeasonGp(currentTeamSeason) : 0;
	const gamesLeft = Math.max(g.get("numGames") - gp, 0);

	// For this season, what happened so far is in currentTeamSeason, so this is just about the rest of the season. For a future season, wp already includes everything we know.
	const winp = futureDraft ? wp : teamOvrWinp;

	// Randomness in the results of the remaining games, which is larger when there are fewer games. Bound winp so it never looks like a team has no chance of winning or losing a game.
	const winpBounded = helpers.bound(winp, 0.1, 0.9);
	const varianceGames =
		gamesLeft > 0 ? (winpBounded * (1 - winpBounded)) / gamesLeft : 0;

	const stdTeamQuality = futureDraft
		? TEAM_QUALITY_STD_FUTURE_SEASON
		: TEAM_QUALITY_STD_CURRENT_SEASON;

	return {
		teamSeason: {
			tid: t.tid,
			cid: currentTeamSeason?.cid ?? t.cid,
			did: currentTeamSeason?.did ?? t.did,
			won: currentTeamSeason?.won ?? 0,
			lost: currentTeamSeason?.lost ?? 0,
			otl: currentTeamSeason?.otl ?? 0,
			tied: currentTeamSeason?.tied ?? 0,
			wonDiv: currentTeamSeason?.wonDiv ?? 0,
			lostDiv: currentTeamSeason?.lostDiv ?? 0,
			otlDiv: currentTeamSeason?.otlDiv ?? 0,
			tiedDiv: currentTeamSeason?.tiedDiv ?? 0,
			wonConf: currentTeamSeason?.wonConf ?? 0,
			lostConf: currentTeamSeason?.lostConf ?? 0,
			otlConf: currentTeamSeason?.otlConf ?? 0,
			tiedConf: currentTeamSeason?.tiedConf ?? 0,
		},
		gamesLeft,
		winp,
		winpStd: Math.sqrt(varianceGames + stdTeamQuality ** 2),
		noDraftPick,
	};
};

const MIN_VALUE = bySport({
	baseball: -0.75,
	basketball: -0.5,
	football: -1,
	hockey: -0.5,
});
const MAX_VALUE = bySport({
	baseball: 2.5,
	basketball: 2,
	football: 3,
	hockey: 2,
});
const getContractValue = (
	contract: PlayerContract,
	normalizedValue: number,
) => {
	const season = g.get("season");
	const phase = g.get("phase");
	if (
		contract.exp === season ||
		(phase > PHASE.PLAYOFFS && contract.exp === season + 1)
	) {
		// Don't care about expiring contracts
		return 0;
	}

	const salaryCap = g.get("salaryCap");
	const normalizedContractAmount = contract.amount / salaryCap;

	const slope =
		(g.get("maxContract") / salaryCap - g.get("minContract") / salaryCap) /
		(MAX_VALUE - MIN_VALUE);

	const expectedAmount = slope * (normalizedValue - MIN_VALUE);

	const contractValue = expectedAmount - normalizedContractAmount;

	// Don't let contract value exceed 0.1, it's just a small boost or a big penalty
	return Math.min(contractValue, 0.1);
};

const getPlayers = async ({
	add,
	remove,
	pidsAdd,
	pidsRemove,
	tid,
	tradingPartnerTid,
}: {
	add: Asset[];
	remove: Asset[];
	pidsAdd: number[];
	pidsRemove: number[];
	tid: number;
	tradingPartnerTid?: number;
}) => {
	const season = g.get("season");
	const phase = g.get("phase");
	const difficultyFudgeFactor = helpers.bound(
		1 + 0.1 * g.get("difficulty"),
		0,
		Infinity,
	); // 2.5% bonus for easy, 2.5% penalty for hard, 10% penalty for insane

	// Fudge factor for AI overvaluing its own players
	const fudgeFactor =
		(tid !== g.get("userTid") && tradingPartnerTid !== g.get("userTid")
			? 1.05
			: 1) * difficultyFudgeFactor;

	// Get players to remove
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);

	for (const p of players) {
		if (!pidsRemove.includes(p.pid)) {
			continue;
		}

		const value = zscore(p.value);

		// Only apply fudge factor to positive assets
		let fudgedValue = value;
		if (fudgedValue > 0) {
			fudgedValue *= fudgeFactor;
		}

		remove.push({
			type: "player",
			value: fudgedValue,
			contractValue: getContractValue(p.contract, value),
			injury: p.injury,
			age: g.get("season") - p.born.year,
			justDrafted: helpers.justDrafted(p, phase, season),
		});
	}

	// Get players to add
	for (const pid of pidsAdd) {
		const p = await idb.cache.players.get(pid);
		if (p) {
			const value = zscore(p.value);

			add.push({
				type: "player",
				value,
				contractValue: getContractValue(p.contract, value),
				injury: p.injury,
				age: g.get("season") - p.born.year,
				justDrafted: helpers.justDrafted(p, phase, season),
			});
		}
	}
};

const EXPONENT = bySport({
	baseball: 3,
	basketball: 7,
	football: 3,
	hockey: 3.5,
});

// Value is on a scale where it makes sense to compare players. Trade value is what actually gets added up when evaluating a trade, to account for one great player being worth more than a few good players.
const valueToTradeValue = (value: number) => {
	return value > 1 ? value ** EXPONENT : value;
};
const tradeValueToValue = (tradeValue: number) => {
	return tradeValue > 1 ? tradeValue ** (1 / EXPONENT) : tradeValue;
};

type PickNumber =
	| {
			// Draft order is already set
			type: "known";
			pick: number;
	  }
	| {
			type: "projected";
			futureDraft: boolean;

			// Projected position of the team in the order going into the draft, where 1 is the worst team. This accounts for the effect of this trade on the team
			slot: number;

			// How much this trade changed slot, which is usually 0
			tradeShift: number;

			// How much we should adjust slot by, to account for uncertainty in the future. This is not necessarily an integer
			bias: number;

			// When trading with the user, we intentionally value draft picks differently. This is how much to adjust the pick by, after accounting for the draft lottery or anything else that determines which pick a slot gets. It's applied to the pick rather than the slot because otherwise a draft lottery would weaken it. This is not necessarily an integer
			userTradeShift: number;
	  };

// All numbers returned here are relative to the start of a round
const getPickNumber = async (
	cache: ValueChangeCache,
	dp: DraftPick,
	season: number,
	pidsAdd: number[],
	pidsRemove: number[],
	tid: number,
	tradingPartnerTid?: number,
): Promise<PickNumber> => {
	if (dp.pick > 0) {
		return {
			type: "known",
			pick: dp.pick,
		};
	}

	const numPicksPerRound = getNumPicksPerRound();

	const futureDraft = season > g.get("season");
	const cachedSlot = (futureDraft ? cache.future : cache).estPicks[
		dp.originalTid
	];
	let temp = cachedSlot;

	// Used to know when to overvalue own pick
	const tradeWithUser = tradingPartnerTid === g.get("userTid");

	// if trading with the user, make sure the AI pick is accurately judged
	// based on what players are outgoing in the trade
	// and just use the cached estimated pick if no players are being exchanged
	if (
		tid !== g.get("userTid") &&
		dp.originalTid === tid &&
		tradeWithUser &&
		pidsAdd.length + pidsRemove.length > 0
	) {
		temp = await getModifiedPickRank(
			cache,
			futureDraft,
			tid,
			pidsAdd,
			pidsRemove,
		);
	}
	const slot = temp !== undefined ? temp : numPicksPerRound / 2;

	// tid rather than originalTid, because it's about what the user can control
	const usersPick = dp.tid === g.get("userTid");

	// For future draft picks, add some uncertainty.
	const regressionTarget = (usersPick ? 0.75 : 0.25) * numPicksPerRound;

	// Never let this improve the future projection of user's picks
	let seasons = helpers.bound(season - g.get("season"), 0, 5);
	if (tradeWithUser && seasons > 0) {
		// When trading with the user, expect things to change rapidly
		seasons = helpers.bound(seasons + 1, 0, 5);
	}

	if (seasons === 0 && g.get("phase") < PHASE.PLAYOFFS) {
		// Would be better to base on fraction of season completed, but oh well
		seasons += 0.5;
	}

	// regressionTarget is a pick, so do the regression on the pick this slot gets. They're only different if the best team picks first
	const reverse = getRoundOrderRule(g.get("draftType"), dp.round) === "reverse";
	const projectedPick = reverse ? numPicksPerRound + 1 - slot : slot;

	// Weighted average of projectedPick and regressionTarget. No rounding, because rounding can result in a better team having a more valuable pick
	const regressedPick =
		(projectedPick * (5 - seasons)) / 5 + (regressionTarget * seasons) / 5;

	// Convert back to a slot, since bias is applied to the slot
	const regressedSlot = reverse
		? numPicksPerRound + 1 - regressedPick
		: regressedPick;

	let estPick = regressedPick;
	if (tradeWithUser && seasons > 0) {
		if (usersPick) {
			// Penalty for user draft picks
			const difficultyFactor = 1 + 1.5 * g.get("difficulty");
			estPick = helpers.bound(
				(estPick + numPicksPerRound / 3.5) * difficultyFactor,
				1,
				numPicksPerRound,
			);
		} else {
			// Bonus for AI draft picks
			estPick = helpers.bound(
				estPick - numPicksPerRound / 3.5,
				1,
				numPicksPerRound,
			);
		}
	}

	return {
		type: "projected",
		futureDraft,
		slot,
		tradeShift: cachedSlot !== undefined ? slot - cachedSlot : 0,
		bias: regressedSlot - slot,
		userTradeShift: estPick - regressedPick,
	};
};

// Value of the player we expect to be available at a pick, where pick is the overall pick number, not relative to the start of the round
const getPickValue = (
	cache: ValueChangeCache,
	season: number,
	pick: number,
) => {
	let value;
	const valuesTemp = cache.estValues[season];
	if (valuesTemp) {
		value = valuesTemp[pick - 1];
	}
	if (value === undefined) {
		value = cache.estValues.default[pick - 1];
	}
	if (value === undefined) {
		value = cache.estValues.default.at(-1);
	}
	if (value === undefined) {
		value = 20;
	}

	return zscore(value);
};

// Since rookies can be cut after the draft, value of a draft pick can't be negative
const MIN_PICK_VALUE = 0.1;

// tradeValue rather than value because any averaging over possible picks needs to happen after applying EXPONENT, since that's what actually gets added up to evaluate a trade. Like a 10% chance at a superstar is worth a lot more than a player who is 10% as good as a superstar.
const getPickTradeValue = (
	cache: ValueChangeCache,
	season: number,
	pick: number,
) => {
	return valueToTradeValue(
		Math.max(MIN_PICK_VALUE, getPickValue(cache, season, pick)),
	);
};

// Number of teams in the order going into the draft
const getNumSlots = (cache: ValueChangeCache) => {
	return cache.wps.filter((row) => !row.projectedTeam.noDraftPick).length;
};

// After the regular season is over, we don't need to project where teams will be going into the draft, we can just look. This returns the probability of each pick in the first round, for each first round pick in this season's draft. Keys are dpid, and arrays are 0 indexed (so index 0 is the 1st pick).
const getCurrentFirstRoundPickProbs = async () => {
	// For a random draft, the order from genOrder is just one of many possibilities
	if (getRoundOrderRule(g.get("draftType"), 1) === "random") {
		return;
	}

	let result;
	try {
		result = await draft.genOrder(true);
	} catch (error) {
		if (error instanceof NotEnoughTeamsError) {
			return;
		}

		throw error;
	}
	const { draftLotteryResult, draftPicks } = result;

	const firstRoundPicks = draftPicks.filter((dp) => dp.round === 1);
	const numPicks = firstRoundPicks.length;

	const pickProbs = new Map<number, number[]>();

	if (draftLotteryResult) {
		const { numPlayInTeams } = await getNumPlayoffTeams(g.get("season"));
		const numToPick = getNumToPick(
			draftLotteryResult.draftType,
			draftLotteryResult.result.length,
			numPlayInTeams,
		);
		const lotteryProbs = await getDraftLotteryProbsCached(
			draftLotteryResult,
			numToPick,
		);

		for (const [i, row] of draftLotteryResult.result.entries()) {
			const probs = new Array<number>(numPicks).fill(0);
			let sum = 0;
			for (let pick = 0; pick < numPicks; pick++) {
				const prob = lotteryProbs?.[i]?.[pick] ?? 0;
				probs[pick] = prob;
				sum += prob;
			}

			// If something is wrong with the lottery probabilities, fall back to the simulated lottery result from genOrder below
			if (Math.abs(sum - 1) < 0.01) {
				pickProbs.set(row.dpid, probs);
			}
		}
	}

	// Everybody not in the lottery
	for (const dp of firstRoundPicks) {
		if (!pickProbs.has(dp.dpid) && dp.pick > 0 && dp.pick <= numPicks) {
			const probs = new Array<number>(numPicks).fill(0);
			probs[dp.pick - 1] = 1;
			pickProbs.set(dp.dpid, probs);
		}
	}

	return pickProbs;
};

const getSimulatedSlotProbs = (
	pickEstimates: PickEstimates,
	quick: boolean,
) => {
	pickEstimates.firstRoundSlotProbs ??= getFirstRoundSlotProbsCached(
		pickEstimates.wps.map((row) => row.projectedTeam),
		quick,
	);

	return pickEstimates.firstRoundSlotProbs;
};

// Move everything in probs by some number of positions, which does not need to be an integer. Anything that would go past either end of the array stays at that end.
const shiftProbs = (probs: number[], shift: number) => {
	if (shift === 0) {
		return probs;
	}

	const maxIndex = probs.length - 1;
	const shifted = new Array<number>(probs.length).fill(0);
	for (const [i, prob] of probs.entries()) {
		if (prob > 0) {
			// If it's between two positions, split it between them
			const index = i + shift;
			const indexBelow = Math.floor(index);
			const fractionAbove = index - indexBelow;
			shifted[helpers.bound(indexBelow, 0, maxIndex)]! +=
				prob * (1 - fractionAbove);
			shifted[helpers.bound(indexBelow + 1, 0, maxIndex)]! +=
				prob * fractionAbove;
		}
	}

	return shifted;
};

// Probability of a team being in each slot in the order of teams going into the draft, where index 0 is the worst team
const getSlotProbs = async (
	cache: ValueChangeCache,
	dp: DraftPick,
	pickNumber: Extract<PickNumber, { type: "projected" }>,
) => {
	let shift = pickNumber.bias;

	// After the first round the differences between picks are small, so it's not worth worrying about uncertainty
	let slotProbs;
	if (dp.round === 1) {
		const pickEstimates = pickNumber.futureDraft ? cache.future : cache;
		slotProbs = (await getSimulatedSlotProbs(pickEstimates, cache.quick)).get(
			dp.originalTid,
		);
	}

	if (slotProbs) {
		// If this trade changes where we project the team to be, shift everything by that amount
		shift += pickNumber.tradeShift;
	} else {
		// No uncertainty, team is just in its projected slot. -1 is to convert to 0 indexed, like slotProbs
		slotProbs = new Array<number>(getNumSlots(cache)).fill(0);
		slotProbs[0] = 1;
		shift += pickNumber.slot - 1;
	}

	return shiftProbs(slotProbs, shift);
};

// Probability of getting each pick in a round, where index 0 is the first pick in the round
const getPickProbs = async (
	cache: ValueChangeCache,
	dp: DraftPick,
	pickNumber: Extract<PickNumber, { type: "projected" }>,
) => {
	const slotProbs = await getSlotProbs(cache, dp, pickNumber);

	// Because of the draft lottery or other draft types where the worst team doesn't necessarily pick first, a team's pick is not always the same as its slot
	const slotPickProbs = await getSlotPickProbsCached(
		dp.round,
		slotProbs.length,
	);

	const pickProbs = new Array<number>(slotProbs.length).fill(0);
	for (const [slotProb, probs] of Iterator.zip([slotProbs, slotPickProbs], {
		mode: "strict",
	})) {
		if (slotProb > 0) {
			for (const [i, prob] of probs.entries()) {
				pickProbs[i]! += slotProb * prob;
			}
		}
	}

	return pickProbs;
};

const getPickInfo = async (
	cache: ValueChangeCache,
	dp: DraftPick,
	rookieSalaries: number[],
	pidsAdd: number[],
	pidsRemove: number[],
	tid: number,
	tradingPartnerTid?: number,
): Promise<Asset> => {
	const season =
		dp.season === "fantasy" || dp.season === "expansion"
			? g.get("season")
			: dp.season;

	const pickNumber = await getPickNumber(
		cache,
		dp,
		season,
		pidsAdd,
		pidsRemove,
		tid,
		tradingPartnerTid,
	);

	const numPicksBeforeRound = getNumPicksPerRound() * (dp.round - 1);

	// After the regular season is over, we don't need to project the order of teams going into this season's draft
	let currentPickProbs;
	if (
		pickNumber.type === "projected" &&
		dp.season === g.get("season") &&
		dp.round === 1 &&
		g.get("phase") >= PHASE.PLAYOFFS
	) {
		cache.currentFirstRoundPickProbs ??= getCurrentFirstRoundPickProbs();
		try {
			currentPickProbs = (await cache.currentFirstRoundPickProbs)?.get(dp.dpid);
		} catch (error) {
			// Don't keep a rejected promise in the cache, so the next call tries again
			cache.currentFirstRoundPickProbs = undefined;
			throw error;
		}
	}

	let estPick;
	let value;
	if (pickNumber.type === "known" || typeof dp.season !== "number") {
		// We know where this pick is, or it's some weird draft where the normal rules don't apply
		estPick =
			numPicksBeforeRound +
			(pickNumber.type === "known"
				? pickNumber.pick
				: helpers.bound(
						Math.round(
							pickNumber.slot + pickNumber.bias + pickNumber.userTradeShift,
						),
						1,
						getNumPicksPerRound(),
					));
		value = Math.max(MIN_PICK_VALUE, getPickValue(cache, season, estPick));
	} else {
		// We don't know where this pick will be, so consider all the possibilities
		// userTradeShift is there because the user has a lot of control over where its picks wind up, and knows more than the AI about how good teams will be. Neither of those matter when the draft order is random.
		const userTradeShift =
			getRoundOrderRule(g.get("draftType"), dp.round) === "random"
				? 0
				: pickNumber.userTradeShift;

		const pickProbs = shiftProbs(
			currentPickProbs ?? (await getPickProbs(cache, dp, pickNumber)),
			userTradeShift,
		);

		let tradeValue = 0;
		let pick = 0;
		for (const [i, prob] of pickProbs.entries()) {
			if (prob > 0) {
				tradeValue +=
					prob * getPickTradeValue(cache, season, numPicksBeforeRound + i + 1);
				pick += prob * (i + 1);
			}
		}

		estPick = numPicksBeforeRound + Math.round(pick);
		value = tradeValueToValue(tradeValue);
	}

	let contractValue = getContractValue(
		{
			// Could be undefined if there are picks beyond numDraftRounds
			amount:
				rookieSalaries[estPick - 1] ??
				rookieSalaries.at(-1) ??
				g.get("minContract"),
			exp: season + 2,
		},
		getPickValue(cache, season, estPick),
	);
	contractValue = Math.max(0, contractValue);

	// Ensure there are no tied pick values
	value -= estPick * 1e-10;

	return {
		type: "pick",
		value,
		contractValue,
		injury: {
			type: "Healthy",
			gamesRemaining: 0,
		},
		dp,

		// Would be better to store age in estValues, but oh well
		age: 20,
		draftPick: estPick,
		draftYear: season,
	};
};

const getPicks = async ({
	cache,
	add,
	remove,
	pidsAdd,
	pidsRemove,
	dpidsAdd,
	dpidsRemove,
	tid,
	tradingPartnerTid,
}: {
	cache: ValueChangeCache;
	add: Asset[];
	remove: Asset[];
	pidsAdd: number[];
	pidsRemove: number[];
	dpidsAdd: number[];
	dpidsRemove: number[];
	tid: number;
	tradingPartnerTid?: number;
}) => {
	// For each draft pick, estimate its value based on the recent performance of the team
	if (dpidsAdd.length > 0 || dpidsRemove.length > 0) {
		const rookieSalaries = draft.getRookieSalaries();

		for (const dpid of dpidsAdd) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				continue;
			}

			const pickInfo = await getPickInfo(
				cache,
				dp,
				rookieSalaries,
				pidsAdd,
				pidsRemove,
				tid,
				tradingPartnerTid,
			);
			add.push(pickInfo);
		}

		for (const dpid of dpidsRemove) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				continue;
			}

			const pickInfo = await getPickInfo(
				cache,
				dp,
				rookieSalaries,
				pidsAdd,
				pidsRemove,
				tid,
				tradingPartnerTid,
			);
			remove.push(pickInfo);
		}

		// Be wary about giving away too many 1st round draft picks!
		if (remove.length > 0) {
			// More value for individual players in basketball, similar to EXPONENT
			const SPORT_FACTOR = bySport({
				baseball: 2.5,
				basketball: 5,
				hockey: 2.5,
				football: 2.5,
			});

			const firstRoundPicks = [];
			const otherPicks = [];
			for (const asset of remove) {
				if (asset.type === "pick") {
					if (asset.dp.round === 1) {
						firstRoundPicks.push(asset);
					} else {
						otherPicks.push(asset);
					}
				}
			}

			// If there are more than 2 picks in the trade, make them a bit more valuable to the AI
			const numBeyond2 = firstRoundPicks.length - 2;
			if (numBeyond2 > 0) {
				for (const pick of firstRoundPicks) {
					if (pick.value > 0) {
						pick.value *= 1 + numBeyond2 / SPORT_FACTOR;
					}
				}
			}

			// Similar but less extreme for other picks
			const numBeyond2Other = otherPicks.length - 2;
			if (numBeyond2Other > 0) {
				for (const pick of otherPicks) {
					if (pick.value > 0) {
						pick.value *= 1 + numBeyond2Other / (SPORT_FACTOR * pick.dp.round);
					}
				}
			}
		}
	}
};

const sumValues = (
	players: Asset[],
	strategy: string,
	tid: number,
	includeInjuries = false,
) => {
	if (players.length === 0) {
		return 0;
	}

	const season = g.get("season");
	const phase = g.get("phase");

	return players.reduce((memo, p) => {
		let playerValue = p.value;

		const treatAsFutureDraftPick =
			p.type === "pick" && (season !== p.draftYear || phase <= PHASE.PLAYOFFS);

		// These factors don't make sense for negative value players!!!
		if (strategy === "rebuilding") {
			// Value young/cheap players and draft picks more. Penalize expensive/old players
			if (treatAsFutureDraftPick) {
				playerValue *= 1.1;
			} else if (p.age <= 19) {
				playerValue *= 1.075;
			} else if (p.age === 20) {
				playerValue *= 1.05;
			} else if (p.age === 21) {
				playerValue *= 1.0375;
			} else if (p.age === 22) {
				playerValue *= 1.025;
			} else if (p.age === 23) {
				playerValue *= 1.0125;
			} else if (p.age === 27) {
				playerValue *= 0.975;
			} else if (p.age === 28) {
				playerValue *= 0.95;
			} else if (p.age >= 29) {
				playerValue *= 0.9;
			}
		} else if (strategy === "contending") {
			// Much of the value for these players comes from potential, which we don't really care about
			if (treatAsFutureDraftPick) {
				playerValue *= 0.825;
			} else if (p.age <= 19) {
				playerValue *= 0.8;
			} else if (p.age === 20) {
				playerValue *= 0.825;
			} else if (p.age === 21) {
				playerValue *= 0.85;
			} else if (p.age === 22) {
				playerValue *= 0.875;
			} else if (p.age === 23) {
				playerValue *= 0.925;
			} else if (p.age === 24) {
				playerValue *= 0.95;
			}
		}

		// Normalize for injuries
		if (includeInjuries && tid !== g.get("userTid")) {
			if (p.injury.gamesRemaining > 75) {
				playerValue -= playerValue * 0.75;
			} else {
				playerValue -= (playerValue * p.injury.gamesRemaining) / 100;
			}
		}

		// Really bad players will just get no PT, but don't to count them as 0 because then AI thinks it can't find a trade
		if (playerValue < 0) {
			playerValue /= 20;
		}

		const contractsFactor = strategy === "rebuilding" ? 2 : 0.5;
		playerValue += contractsFactor * p.contractValue;

		// if a player was just drafted and can be released, they shouldn't have negative value
		if (p.type === "player" && p.justDrafted) {
			playerValue = Math.max(0, playerValue);
		}

		return memo + valueToTradeValue(playerValue);
	}, 0);
};

export const getEstPicks = async (
	teamOvrsSorted: { ovr: number; tid: number }[],
) => {
	const teams = (await idb.cache.teams.getAll()).filter((t) => !t.disabled);

	const allTeamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);

	const teamInfos = teams.map((t) => {
		let teamOvrIndex = teamOvrsSorted.findIndex((t2) => t2.tid === t.tid);
		if (teamOvrIndex < 0) {
			// This happens if a team has no players on it - just assume they are the worst
			teamOvrIndex = teamOvrsSorted.length - 1;
		}

		return {
			t,
			noDraftPick:
				g.get("challengeNoDraftPicks") && g.get("userTids").includes(t.tid),
			// 25% to 75% based on rank
			teamOvrWinp: ovrIndexToEstWinPercent(teamOvrIndex),
			teamSeason: allTeamSeasons.find((teamSeason) => teamSeason.tid === t.tid),
		};
	});

	// Estimate the order of the picks by team
	const getPickEstimates = (futureDraft: boolean): PickEstimates => {
		const wps = teamInfos.map(({ t, noDraftPick, teamOvrWinp, teamSeason }) => {
			const wp = getEstWinPercent({ futureDraft, teamOvrWinp, teamSeason });
			return {
				tid: t.tid,
				wp,
				projectedTeam: getProjectedTeam({
					futureDraft,
					noDraftPick,
					t,
					teamOvrWinp,
					teamSeason,
					wp,
				}),
			};
		});

		// Get rank order of wps http://stackoverflow.com/a/14834599/786644
		wps.sort((a, b) => a.wp - b.wp);

		// For each team, what is their estimated draft position?
		const estPicks: Record<number, number> = {};
		for (const [i, wp] of wps.entries()) {
			estPicks[wp.tid] = i + 1;
		}

		return {
			estPicks,
			wps,
		};
	};

	return {
		...getPickEstimates(false),

		// For drafts after the current season's draft
		future: getPickEstimates(true),
	};
};

type PickEstimates = {
	estPicks: Record<number, number>;
	wps: {
		tid: number;
		wp: number;

		// Same team, in the format needed for getFirstRoundSlotProbs
		projectedTeam: ProjectedTeam;
	}[];

	// Filled in only when needed, since it's slow
	firstRoundSlotProbs?: ReturnType<typeof getFirstRoundSlotProbsCached>;
};

type ValueChangeCache = PickEstimates & {
	estValues: TradePickValues;
	future: PickEstimates;

	// See ValueChangeCalculator
	quick: boolean;

	// Filled in only when needed
	currentFirstRoundPickProbs?: ReturnType<typeof getCurrentFirstRoundPickProbs>;

	teamOvrs: {
		tid: number;
		ovr: number;
	}[];
};

type ToUpdate = {
	draft: boolean;

	// false - no update. "all" - update all teams. number[] = update only these specific teams
	teams: false | "all" | number[];
};

// tradingPartnerTid is currently just used to determine if this is a trade with the user, so additional fuzz can be applied
export class ValueChangeCalculator {
	private cache: ValueChangeCache | undefined;

	// Less precise draft pick values, for when speed matters more
	private quick: boolean;

	private toUpdate: ToUpdate = {
		draft: true,
		teams: "all",
	};

	constructor({ quick = false }: { quick?: boolean } = {}) {
		this.quick = quick;
	}

	private async init() {
		await player.updateOvrMeanStd();
		return this.getUpdatedCache();
	}

	private async getUpdatedCache() {
		const toUpdate = { ...this.toUpdate };
		this.toUpdate = { draft: false, teams: false };

		const estValues =
			toUpdate.draft || !this.cache
				? await trade.getPickValues()
				: this.cache.estValues;

		if (toUpdate.teams || !this.cache) {
			const playersByTid = Map.groupBy(
				await idb.cache.players.indexGetAll("playersByTid", [0, Infinity]),
				(p) => p.tid,
			);
			const teamOvrs: {
				tid: number;
				ovr: number;
			}[] = [];
			let prevTeamOvrsByTid;
			for (const [tid, players] of playersByTid) {
				let row;
				if (
					this.cache &&
					Array.isArray(toUpdate.teams) &&
					!toUpdate.teams.includes(tid)
				) {
					if (!prevTeamOvrsByTid) {
						prevTeamOvrsByTid = groupByUnique(this.cache.teamOvrs, "tid");
					}
					row = prevTeamOvrsByTid[tid];
				}

				if (row === undefined) {
					const ovr = team.ovr(
						players.map((p) => ({
							pid: p.pid,
							injury: p.injury,
							value: p.value,
							ratings: {
								ovr: last(p.ratings).ovr,
								ovrs: last(p.ratings).ovrs,
								pos: last(p.ratings).pos,
							},
						})),
					);

					row = { tid, ovr };
				}

				teamOvrs.push(row);
			}
			teamOvrs.sort((a, b) => b.ovr - a.ovr);

			return {
				...(await getEstPicks(teamOvrs)),
				currentFirstRoundPickProbs: undefined,
				estValues,
				quick: this.quick,
				teamOvrs,
			};
		} else {
			return {
				...this.cache,
				estValues,
			};
		}
	}

	invalidateCache(toUpdate: Partial<ToUpdate>) {
		// Merge with existing this.toUpdate - probably never matters vs overwriting, but just to be sure
		if (toUpdate.draft !== undefined) {
			this.toUpdate.draft = this.toUpdate.draft || toUpdate.draft;
		}
		if (toUpdate.teams === "all") {
			this.toUpdate.teams = "all";
		} else if (Array.isArray(toUpdate.teams)) {
			if (Array.isArray(this.toUpdate.teams)) {
				this.toUpdate.teams = Array.from(
					new Set([...this.toUpdate.teams, ...toUpdate.teams]),
				);
			} else if (this.toUpdate.teams === false) {
				this.toUpdate.teams = toUpdate.teams;
			}
		}
	}

	async evaluate({
		tid,
		pidsAdd,
		pidsRemove,
		dpidsAdd,
		dpidsRemove,
		tradingPartnerTid,
	}: {
		tid: number;
		pidsAdd: number[];
		pidsRemove: number[];
		dpidsAdd: number[];
		dpidsRemove: number[];
		tradingPartnerTid: number | undefined;
	}): Promise<number> {
		if (!this.cache) {
			this.cache = await this.init();
		} else if (this.toUpdate.draft || this.toUpdate.teams) {
			this.cache = await this.getUpdatedCache();
		}

		// Get value and skills for each player on team or involved in the proposed transaction
		const add: Asset[] = [];
		const remove: Asset[] = [];
		const t = await idb.cache.teams.get(tid);

		if (!t) {
			throw new Error("Invalid team");
		}

		const strategy = t.strategy;

		await getPlayers({
			add,
			remove,
			pidsAdd,
			pidsRemove,
			tid,
			tradingPartnerTid,
		});
		await getPicks({
			cache: this.cache,
			add,
			remove,
			pidsAdd,
			pidsRemove,
			dpidsAdd,
			dpidsRemove,
			tid,
			tradingPartnerTid,
		});

		// console.log("ADD");
		const valuesAdd = sumValues(add, strategy, tid, true);
		// console.log("Total", valuesAdd);

		// console.log("REMOVE");
		const valuesRemove = sumValues(remove, strategy, tid);
		// console.log("Total", valuesRemove);

		return valuesAdd - valuesRemove;
	}
}

const getModifiedPickRank = async (
	cache: ValueChangeCache,
	futureDraft: boolean,
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
) => {
	// later we need to find the new ranks of this team's ovr/estimated win%
	// it's cleaner to determine this by temporarily removing the old team info from the cached lists
	const newTeamOvrs = cache.teamOvrs.filter((t) => t.tid !== tid);
	const newWps = (futureDraft ? cache.future : cache).wps.filter(
		(w) => w.tid !== tid,
	);

	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsBySeasonTid",
		[g.get("season"), tid],
	);
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);
	const playersAfterTrade = players.filter((p) => !pidsRemove.includes(p.pid));
	for (const pid of pidsAdd) {
		const p = await idb.cache.players.get(pid);
		if (p) {
			playersAfterTrade.push(p);
		}
	}
	const playerRatings = playersAfterTrade.map((p) => ({
		pid: p.pid,
		injury: p.injury,
		value: p.value,
		ratings: {
			ovr: last(p.ratings).ovr,
			ovrs: last(p.ratings).ovrs,
			pos: last(p.ratings).pos,
		},
	}));

	const newTeamOvr = team.ovr(playerRatings);
	let newTeamOvrIndex = newTeamOvrs.findIndex((t) => t.ovr < newTeamOvr);
	if (newTeamOvrIndex === -1) {
		// Worst Team (no -1 because we already removed this team from newTeamOvrs)
		newTeamOvrIndex = newTeamOvrs.length;
	}

	const newWp = getEstWinPercent({
		futureDraft,
		teamOvrWinp: ovrIndexToEstWinPercent(newTeamOvrIndex),
		teamSeason,
	});

	let newRank = newWps.findIndex((w) => newWp < w.wp);
	if (newRank === -1) {
		// Best Team (no -1 because we already removed this team from newTeamOvrs)
		newRank = newWps.length;
	}
	newRank += 1; // Index to rank

	return newRank;
};
