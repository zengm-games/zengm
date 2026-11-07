import { PLAYER } from "../../../common/constants.ts";
import { getCurrentContract } from "../../../common/contracts.ts";
import type {
	ContractEndedEarly,
	PlayerWithoutKey,
} from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import {
	endContract,
	isContractFullyPaid,
	setContractDemandFromCurrentContract,
	updateOwedByTids,
} from "../contract/index.ts";

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

	// If his contract is not fully paid yet, it ends. This is the team that released him, which still owes the rest of it, or undefined if nobody owes it, like when his team is removed from the league. Console scripts from before this was a parameter also get undefined.
	//
	// null if he can't have a contract like that, like a player whose contract expired, or who is already a free agent.
	releasedByTid: number | undefined | null,
) => {
	const contract = getCurrentContract(p);

	// Free agents always have a contract demand. This is based on his contract, so it's before his contract ends.
	setContractDemandFromCurrentContract(p);

	// His contract ends, so he has no current contract as a free agent
	if (contract && !isContractFullyPaid(contract)) {
		if (releasedByTid === null) {
			throw new Error(
				`Contract for ${p.firstName} ${p.lastName} (pid ${p.pid}) is not fully paid, so it needs a reason to end`,
			);
		}

		const endedEarly: ContractEndedEarly = {
			season: g.get("season"),
			phase: g.get("phase"),
		};
		if (releasedByTid !== undefined) {
			endedEarly.tid = releasedByTid;
		}
		endContract(contract, endedEarly);
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
