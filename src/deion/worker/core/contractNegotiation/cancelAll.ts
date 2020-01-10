import { idb } from "../../db";
import { updatePlayMenu, updateStatus } from "../../util";

/**
 * Cancel all ongoing contract negotiations.
 *
 * Currently, the only time there should be multiple ongoing negotiations in the first place is when a user is re-signing players at the end of the season, although that should probably change eventually.
 *
 * @memberOf core.contractNegotiation
 * @return {Promise}
 */
const cancelAll = async () => {
	await idb.cache.negotiations.clear();
	await updateStatus("Idle");
	await updatePlayMenu();
};

export default cancelAll;
