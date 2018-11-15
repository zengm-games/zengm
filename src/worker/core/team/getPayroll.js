// @flow

import type { ContractInfo } from "../../../common/types";
import getContracts from "./getContracts";

/**
 * Get the total current payroll for a team.
 *
 * This includes players who have been released but are still owed money from their old contracts.
 *
 * @memberOf core.team
 * @param {number | ContractInfo[]} tid Team ID, or a list of contracts from getContracts.
 * @return {Promise.<number>} Resolves to payroll in thousands of dollars.
 */
async function getPayroll(input: number | ContractInfo[]): Promise<number> {
    const contracts =
        typeof input === "number" ? await getContracts(input) : input;

    let payroll = 0;
    for (let i = 0; i < contracts.length; i++) {
        payroll += contracts[i].amount; // No need to check exp, since anyone without a contract for the current season will not have an entry
    }

    return payroll;
}

export default getPayroll;
