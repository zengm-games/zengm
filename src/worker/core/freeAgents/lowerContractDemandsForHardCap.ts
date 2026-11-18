import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { team } from "../index.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";

// With a hard cap, lower the contract demands of players on a team until the team's payroll (signed contracts plus these demands) fits under the cap, like for random players in a new league before their demands become contracts. Only the demands of the players passed in are lowered.
//
// Returns the tids of teams that are still over the cap, because they can't get under it even with all of these players at the min contract.
export const lowerContractDemandsForHardCap = async (
	players: Pick<PlayerWithoutKey, "contractDemand" | "tid">[],
) => {
	const tidsOverCap: number[] = [];
	if (g.get("salaryCapType") !== "hard") {
		return tidsOverCap;
	}

	const minContract = g.get("minContract");
	const salaryCap = g.get("salaryCap");

	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		if (t.disabled) {
			continue;
		}

		const contractDemands = players
			.filter((p) => p.tid === t.tid)
			.map((p) => p.contractDemand)
			.filter((contractDemand) => contractDemand !== undefined);
		let payroll = await team.getPayroll(t.tid);
		for (const contractDemand of contractDemands) {
			payroll += contractDemand.amount;
		}

		while (payroll > salaryCap) {
			let foundAny = false;

			for (const contractDemand of contractDemands) {
				if (contractDemand.amount >= minContract + 10) {
					payroll -= 10;
					contractDemand.amount -= 10;
					foundAny = true;
				} else if (contractDemand.amount > minContract) {
					payroll -= contractDemand.amount - minContract;
					contractDemand.amount = minContract;
					foundAny = true;
				}
			}

			if (!foundAny) {
				tidsOverCap.push(t.tid);
				break;
			}
		}
	}

	return tidsOverCap;
};
