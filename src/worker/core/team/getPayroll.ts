import { idb } from "../../db/index.ts";
import type { ContractInfo } from "../../../common/types.ts";
import { getCurrentContract } from "../../../common/contracts.ts";
import { getOwedContracts, getPayrollAmount } from "../contract/index.ts";

/**
 * Get the total current payroll for a team.
 *
 * This includes players who have been released but are still owed money from their old contracts. Players on the roster who haven't signed yet, like some draft picks, don't count until they sign.
 *
 * @memberOf core.team
 * @param {number | ContractInfo[]} tid Team ID, or a list of contracts from getContracts.
 * @param {number | undefined} season Only with a team ID. If defined, the payroll for that season, otherwise for the first season that's not fully paid yet.
 * @return {Promise.<number>} Resolves to payroll in thousands of dollars.
 */
const getPayroll = async (
	input: number | ContractInfo[],
	season?: number,
): Promise<number> => {
	let payroll = 0;

	if (typeof input === "number") {
		const tid = input;
		for (const p of await idb.cache.players.indexGetAll("playersByTid", tid)) {
			const contract = getCurrentContract(p);
			if (contract) {
				payroll += getPayrollAmount(contract, season);
			}
		}
		for (const { contract } of await getOwedContracts(tid)) {
			payroll += getPayrollAmount(contract, season);
		}
	} else {
		if (season !== undefined) {
			throw new Error("season parameter is not supported");
		}

		for (const contract of input) {
			payroll += contract.amount;
		}
	}

	return payroll;
};

export default getPayroll;
