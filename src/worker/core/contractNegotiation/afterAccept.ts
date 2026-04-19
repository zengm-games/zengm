import { team } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, toUI, recomputeLocalUITeamOvrs } from "../../util/index.ts";

// This used to be at the end of `accept` but when resigning players in a loop it's redundant to run this every time, and it also gives more control about when exactly to update the UI to do this later
const afterAccept = async (tid: number) => {
	// If a depth chart exists, place this player in the depth chart so they are ahead of every player they are
	// better than, without otherwise disturbing the depth chart order
	const t = await idb.cache.teams.get(tid);
	const onlyNewPlayers = t ? !t.keepRosterSorted : false;
	await team.rosterAutoSort(g.get("userTid"), onlyNewPlayers);

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();
};

export default afterAccept;
