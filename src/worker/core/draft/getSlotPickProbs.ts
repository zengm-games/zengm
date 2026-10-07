import type { DraftLotteryResult, DraftType } from "../../../common/types.ts";
import { range } from "../../../common/utils.ts";
import { g } from "../../util/index.ts";
import { getDraftLotteryProbs } from "./draftLottery.ts";
import {
	draftHasLottery,
	getLotteryChances,
	getRoundOrderRule,
	NotEnoughTeamsError,
} from "./genOrder.ts";

// This is for hypothetical future drafts where we don't know which team will be in which slot, so this ignores anything that depends on the specific teams, like nba2027 restrictions and dividing chances over tied teams
const getGenericLotteryChances = async (
	draftType: DraftType,
	numTeams: number,
) => {
	// For cola, chances depend entirely on which teams are in the lottery, so there is nothing generic we can say
	if (!draftHasLottery(draftType) || draftType === "cola") {
		return;
	}

	try {
		return {
			draftType,
			...(await getLotteryChances({
				draftType,
				firstRoundTeams: range(numTeams).map((i) => {
					return {
						tid: -1 - i,
					};
				}),
				draftPicksIndexed: [],
			})),
		};
	} catch (error) {
		if (error instanceof NotEnoughTeamsError) {
			return;
		}

		throw error;
	}
};

/**
 * For each slot in the order of teams going into the draft (0 is the team with the worst record, see getTeamsByRound), what is the probability of getting each pick in a round?
 *
 * Returns an array indexed like probs[slot][pick], where both are 0 indexed and pick is relative to the start of the round.
 *
 * How is this different than getDraftLotteryProbs?
 * - getDraftLotteryProbs is for a specific draft lottery where we know which teams are in it, so it accounts for things that depend on those teams (nba2027 restrictions, chances divided over tied teams, cola). This is for a hypothetical future draft where all we know is the draft type, so it only uses the default chances for each slot.
 * - getDraftLotteryProbs only covers the lottery teams in the first round of a draft type with a lottery. This covers all teams, in any round, for any draft type.
 *
 * For the lottery teams in the first round, this calls getDraftLotteryProbs to do the actual math.
 */
export const getSlotPickProbs = async ({
	draftType,
	round,
	numTeams,
}: {
	draftType: DraftType;
	round: number;
	numTeams: number;
}) => {
	const probs = range(numTeams).map(() => {
		return new Array<number>(numTeams).fill(0);
	});

	const setSameOrder = (slot: number) => {
		probs[slot]![slot] = 1;
	};

	const roundOrderRule = getRoundOrderRule(draftType, round);

	if (roundOrderRule === "random") {
		for (const row of probs) {
			row.fill(1 / numTeams);
		}
	} else if (roundOrderRule === "reverse") {
		for (let slot = 0; slot < numTeams; slot++) {
			probs[slot]![numTeams - 1 - slot] = 1;
		}
	} else if (roundOrderRule === "same") {
		for (let slot = 0; slot < numTeams; slot++) {
			setSameOrder(slot);
		}
	} else {
		const lottery = await getGenericLotteryChances(draftType, numTeams);
		const numLotteryTeams = lottery?.numLotteryTeams ?? 0;

		let lotteryProbs;
		if (lottery && roundOrderRule === "lottery") {
			const draftLotteryResult = {
				season: g.get("season"),
				draftType: lottery.draftType,
				result: lottery.chances.map((chances, i) => {
					return {
						tid: -1 - i,
						originalTid: -1 - i,
						chances,
						pick: undefined,
						dpid: -1 - i,
					};
				}),
				nba2027: lottery.nba2027Restrictions,
			} as DraftLotteryResult<false>;

			lotteryProbs = getDraftLotteryProbs(
				draftLotteryResult,
				lottery.draftType,
				lottery.numToPick,
			).probs;
		}

		for (let slot = 0; slot < numTeams; slot++) {
			if (slot >= numLotteryTeams) {
				setSameOrder(slot);
			} else if (roundOrderRule === "reverseLotteryTeams") {
				probs[slot]![numLotteryTeams - 1 - slot] = 1;
			} else if (lotteryProbs) {
				for (let pick = 0; pick < numLotteryTeams; pick++) {
					probs[slot]![pick] = lotteryProbs[slot]?.[pick] ?? 0;
				}
			} else {
				setSameOrder(slot);
			}
		}
	}

	return probs;
};
