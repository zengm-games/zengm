import { PHASE, PLAYER } from "../../../common/constants.ts";
import {
	getContractExp,
	getCurrentContract,
} from "../../../common/contracts.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { getPayrollSeason } from "../../util/getPayrollSeason.ts";
import { isContractFullyPaid, updateOwedByTids } from "./index.ts";

// The rules about contracts that the rest of the game relies on (see getCurrentContract):
//
// - A player who is not retired has either a current contract or a contract demand. Retired players have neither.
// - Only players on a team have a current contract, and it covers the payroll season or later (see getPayrollSeason), so once re-signing starts, an expiring contract is over. In a fantasy draft, players who were on a team keep theirs too (see selectPlayer).
// - Any other contract that still has seasons left to be paid ended early
// - p.owedByTids matches the released contracts that are still owed
//
// The game itself follows these rules, but players from outside the game (league files, imported players) might not. This makes a player follow them, and returns a description of each thing that was fixed.
export const repairContracts = (
	p: Pick<
		PlayerWithoutKey,
		"contractDemand" | "contracts" | "owedByTids" | "tid"
	>,
) => {
	const phase = g.get("phase");
	const season = g.get("season");
	const fixes: string[] = [];

	const canHaveContract =
		p.tid >= 0 || (p.tid === PLAYER.UNDRAFTED && phase === PHASE.FANTASY_DRAFT);
	const lastContract = p.contracts.at(-1);
	const lastContractOpen =
		lastContract !== undefined && !lastContract.endedEarly;

	// His last contract, if it can be his current contract
	const contract =
		canHaveContract &&
		lastContractOpen &&
		getContractExp(lastContract) >= getPayrollSeason()
			? lastContract
			: undefined;

	if (p.tid === PLAYER.RETIRED) {
		if (p.contractDemand) {
			delete p.contractDemand;
			fixes.push("retired player had a contract demand");
		}
	} else if (contract && p.contractDemand && p.tid >= 0) {
		// A player on a team with a contract never has a contract demand (players who haven't re-signed yet are free agents during the re-signing phase)
		delete p.contractDemand;
		fixes.push("player on a team with a contract had a contract demand");
	} else if (!contract && !p.contractDemand) {
		// Can be normalized later, see normalizeContractDemands
		p.contractDemand = {
			amount: g.get("minContract"),
			exp: season,
		};
		fixes.push("no contract or contract demand");
	}

	// Nobody pays the rest of it, like if it's not known which team released him
	if (
		lastContractOpen &&
		lastContract !== getCurrentContract(p) &&
		!isContractFullyPaid(lastContract)
	) {
		lastContract.endedEarly = {
			season,
			phase,
		};
		fixes.push("unfinished contract that is not his current contract");
	}

	const prevOwedByTids = JSON.stringify(p.owedByTids);
	updateOwedByTids(p);
	if (JSON.stringify(p.owedByTids) !== prevOwedByTids) {
		fixes.push("owedByTids did not match released contracts");
	}

	return fixes;
};
