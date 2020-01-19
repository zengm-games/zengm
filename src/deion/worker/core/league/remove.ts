import backboard from "backboard";
import close from "./close";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Delete an existing league.
 *
 * @memberOf core.league
 * @param {number} lid League ID.
 * @param {function()=} cb Optional callback.
 */
const remove = async (lid: number) => {
	if (g.get("lid") === lid) {
		close(true);
	}

	await idb.meta.delete("leagues", lid);
	await backboard.delete(`league${lid}`);
};

export default remove;
