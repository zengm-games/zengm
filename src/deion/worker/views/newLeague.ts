import { idb } from "../db";
import type { ViewInput } from "../../common/types";

const updateNewLeague = async ({ lid, type }: ViewInput<"newLeague">) => {
	if (lid !== undefined) {
		// Importing!
		const l = await idb.meta.get("leagues", lid);

		if (l) {
			return {
				lid,
				difficulty: l.difficulty,
				name: l.name,
				lastSelectedTid: l.tid,
			};
		}
	}

	let newLid: number | undefined;

	// Find most recent league and add one to the LID
	const cursor = await idb.meta
		.transaction("leagues")
		.store.openCursor(undefined, "prev");
	if (cursor) {
		newLid = cursor.value.lid + 1;
	}

	if (newLid === undefined) {
		newLid = 1;
	}

	let lastSelectedTid = await idb.meta.get("attributes", "lastSelectedTid");

	if (typeof lastSelectedTid !== "number" || Number.isNaN(lastSelectedTid)) {
		lastSelectedTid = -1;
	}

	return {
		lid: undefined,
		difficulty: undefined,
		name: `League ${newLid}`,
		lastSelectedTid,
		type,
	};
};

export default updateNewLeague;
