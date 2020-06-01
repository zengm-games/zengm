import { idb } from "../db";
import type { ViewInput, RealTeamInfo } from "../../common/types";

const updateNewLeague = async ({ lid, type }: ViewInput<"newLeague">) => {
	if (lid !== undefined) {
		// Importing!
		const l = await idb.meta.get("leagues", lid);

		if (l) {
			return {
				lid,
				difficulty: l.difficulty,
				name: l.name,
				type,
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

	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;

	return {
		lid: undefined,
		difficulty: undefined,
		name: `League ${newLid}`,
		realTeamInfo,
		type,
	};
};

export default updateNewLeague;
