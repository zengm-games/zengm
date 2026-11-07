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
			reason: "fantasyDraft" | "contraction";
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

	// Required if he has a contract that's not fully paid yet
	contractEndReason?: ContractEndReason,
) => {
	const contract = getCurrentContract(p);

	// Free agents always have a contract demand. This is based on his contract, so it's before his contract ends.
	setContractDemandFromCurrentContract(p);

	// His contract ends, so he has no current contract as a free agent
	if (contract && !isContractFullyPaid(contract)) {
		if (!contractEndReason) {
			throw new Error(
				`No reason for ending the contract of ${p.firstName} ${p.lastName} (pid ${p.pid})`,
			);
		}

		endContract(contract, {
			season: g.get("season"),
			phase: g.get("phase"),
			...contractEndReason,
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
