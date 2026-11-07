import { PHASE, PLAYER } from "../../../common/constants.ts";
import { getContractExp } from "../../../common/contracts.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { isContractFullyPaid, updateOwedByTids } from "./index.ts";

// The rules about contracts that the rest of the game relies on (see getCurrentContract):
//
// - A player on a team has either a contract that covers this season or later, or a contract demand (like an unsigned draft pick), never both
// - In a fantasy draft, players who were on a team still have their contracts (see selectPlayer), and other draft prospects have contract demands
// - Other players who are not retired (free agents, draft prospects) have a contract demand, and no contract that still has seasons left to be paid, unless it ended early
// - Retired players have no contract demand
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

	// A contract demand to use when one is missing, like at the start of the season. It can be normalized later, see normalizeContractDemands.
	const addPlaceholderContractDemand = (reason: string) => {
		p.contractDemand = {
			amount: g.get("minContract"),
			exp: season,
		};
		fixes.push(reason);
	};

	const lastContract = p.contracts.at(-1);
	const lastContractOpen =
		lastContract !== undefined && !lastContract.endedEarly;

	if (p.tid === PLAYER.RETIRED) {
		if (p.contractDemand) {
			delete p.contractDemand;
			fixes.push("retired player had a contract demand");
		}
	} else if (p.tid >= 0) {
		// A contract that ended before this season is not his current contract anymore, like a real player whose contract data is missing for this season
		const hasContract =
			lastContractOpen && getContractExp(lastContract) >= season;
		if (hasContract && p.contractDemand) {
			delete p.contractDemand;
			fixes.push("player with a contract had a contract demand");
		} else if (!hasContract && !p.contractDemand) {
			addPlaceholderContractDemand(
				"player on a team had no contract or contract demand",
			);
		}
	} else if (p.tid === PLAYER.UNDRAFTED && phase === PHASE.FANTASY_DRAFT) {
		if (!lastContractOpen && !p.contractDemand) {
			addPlaceholderContractDemand(
				"player in a fantasy draft had no contract or contract demand",
			);
		}
	} else {
		if (!p.contractDemand) {
			addPlaceholderContractDemand("player had no contract demand");
		}

		// Nobody pays the rest of it, like if it's not known which team released him
		if (lastContractOpen && !isContractFullyPaid(lastContract)) {
			lastContract.endedEarly = {
				season,
				phase,
				reason: "unknown",
			};
			fixes.push("player not on a team had an unfinished contract");
		}
	}

	const prevOwedByTids = JSON.stringify(p.owedByTids);
	updateOwedByTids(p);
	if (JSON.stringify(p.owedByTids) !== prevOwedByTids) {
		fixes.push("owedByTids did not match released contracts");
	}

	return fixes;
};
