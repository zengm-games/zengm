import { idb } from "../../db/index.ts";
import type { ContractInfo, Player } from "../../../common/types.ts";
import { last } from "../../../common/utils.ts";
import {
	getContractExp,
	getCurrentContract,
} from "../../../common/contracts.ts";
import { getOwedContracts, getPayrollAmount } from "../contract/index.ts";

const getPlayerInfo = (p: Player) => {
	const { pos, skills } = last(p.ratings);
	return {
		firstName: p.firstName,
		lastName: p.lastName,
		skills,
		pos,
		injury: p.injury,
		watch: p.watch ?? 0,
	};
};

/**
 * Gets all the contracts a team owes.
 *
 * This includes contracts for players who have been released but are still owed money.
 *
 * @memberOf core.team
 * @param {number} tid Team ID.
 * @returns {Promise.Array} Array of objects containing contract information.
 */
const getContracts = async (tid: number): Promise<ContractInfo[]> => {
	const contracts: ContractInfo[] = [];

	// First, players currently on the roster. Players who haven't signed yet, like some draft picks, don't count until they sign.
	for (const p of await idb.cache.players.indexGetAll("playersByTid", tid)) {
		const contract = getCurrentContract(p);
		if (contract) {
			contracts.push({
				pid: p.pid,
				...getPlayerInfo(p),
				jerseyNumber: p.stats.at(-1)?.jerseyNumber,
				amount: getPayrollAmount(contract),
				exp: getContractExp(contract),
				start: contract.start,
				amounts: contract.amounts,
				released: false,
			});
		}
	}

	// Then, any released players still owed money
	for (const { p, contract } of await getOwedContracts(tid)) {
		contracts.push({
			pid: p.pid,
			...getPlayerInfo(p),
			jerseyNumber: undefined,
			amount: getPayrollAmount(contract),
			exp: getContractExp(contract),
			start: contract.start,
			amounts: contract.amounts,
			released: true,
		});
	}

	return contracts;
};

export default getContracts;
