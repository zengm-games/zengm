import { idb } from "../../db/index.ts";

/**
 * Cancel all ongoing contract negotiations.
 *
 * Currently, the only time there should be any ongoing negotiations in the first place is when a user is re-signing players at the end of the season.
 */
const cancelAll = async () => {
	await idb.cache.negotiations.clear();
};

export default cancelAll;
