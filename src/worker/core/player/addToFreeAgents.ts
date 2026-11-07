import { PLAYER } from "../../../common/constants.ts";
import { getCurrentContract } from "../../../common/contracts.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import {
	endContract,
	isContractFullyPaid,
	setContractDemandFromCurrentContract,
	updateOwedByTids,
} from "../contract/index.ts";

// Why a player's contract ends when he becomes a free agent before it's fully paid. A released player's contract is still owed by the team that released him.
export type ContractEndReason =
	| {
			reason: "released";
			tid: number;
	  }
	| {
			reason: "fantasyDraft" | "contraction" | "unknown";
	  };

/**
 * Adds player to the free agents list.
 *
 * This should be THE ONLY way that players are added to the free agents list.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 */
const addToFreeAgents = (
	p: PlayerWithoutKey,
	numPlayersTradedAwayNormalized: Record<number, number>,

	// Why his contract ends, if it's not fully paid yet. null if he can't have a contract like that, like a player whose contract expired, or who is already a free agent.
	contractEndReason: ContractEndReason | null,
) => {
	const contract = getCurrentContract(p);

	// Free agents always have a contract demand. This is based on his contract, so it's before his contract ends.
	setContractDemandFromCurrentContract(p);

	// His contract ends, so he has no current contract as a free agent
	if (contract && !isContractFullyPaid(contract)) {
		if (contractEndReason === null) {
			throw new Error(
				`Contract for ${p.firstName} ${p.lastName} (pid ${p.pid}) is not fully paid, so it needs a reason to end`,
			);
		}

		endContract(contract, {
			season: g.get("season"),
			phase: g.get("phase"),

			// Extra check is for console scripts from before contractEndReason was a required parameter
			...(contractEndReason ?? { reason: "unknown" }),
		});
		updateOwedByTids(p);
	}

	p.tid = PLAYER.FREE_AGENT;
	p.numDaysFreeAgent = 0;
	p.ptModifier = 1;

	// Extra check is for console scripts from before numPlayersTradedAwayNormalized was a required parameter
	// Spread is because addToFreeAgents is often called in a loop, with numPlayersTradedAwayNormalized calculated once up front
	p.numPlayersTradedAwayNormalized = numPlayersTradedAwayNormalized
		? { ...numPlayersTradedAwayNormalized }
		: undefined;
};

export default addToFreeAgents;
