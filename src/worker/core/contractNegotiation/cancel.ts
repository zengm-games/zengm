import { PHASE } from "../../../common";
import { idb } from "../../db";
import { g, helpers, lock, updatePlayMenu, updateStatus } from "../../util";

/**
 * Cancel contract negotiations with a player.
 */
const cancel = async (pid: number) => {
	await idb.cache.negotiations.delete(pid);
	const negotiationInProgress = await lock.negotiationInProgress();

	if (!negotiationInProgress) {
		if (g.get("phase") === PHASE.FREE_AGENCY) {
			await updateStatus(helpers.daysLeft(true));
		} else {
			await updateStatus("Idle");
		}

		updatePlayMenu();
	}
};

export default cancel;
