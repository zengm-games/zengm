import getPayroll from "./getPayroll.ts";
import { idb } from "../../db/index.ts";

/**
 * Get the total current payroll for every team team.
 *
 * @memberOf core.team
 * @return {Promise} Resolves to an array of payrolls, ordered by team id.
 */
const getPayrolls = async () => {
	const payrolls: Record<number, number> = {};
	const teams = (await idb.cache.teams.getAll()).filter((t) => !t.disabled);
	for (const t of teams) {
		payrolls[t.tid] = await getPayroll(t.tid);
	}
	return payrolls;
};

export default getPayrolls;
