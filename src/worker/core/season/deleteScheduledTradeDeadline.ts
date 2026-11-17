import { idb } from "../../db/index.ts";
import { toUI } from "../../util/index.ts";
import { recomputeLocalUITeamOvrs } from "../../util/recomputeLocalUITeamOvrs.ts";

// The trade deadline counts as the user's upcoming game, so after removing it, the UI needs to be told about the next upcoming game too
const deleteScheduledTradeDeadline = async (gid: number) => {
	await idb.cache.schedule.delete(gid);
	await toUI("deleteGames", [[gid]]);
	await recomputeLocalUITeamOvrs();
};

export default deleteScheduledTradeDeadline;
