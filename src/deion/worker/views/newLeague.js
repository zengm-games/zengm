// @flow

import { idb } from "../db";

async function updateNewLeague({
	lid,
}: {
	lid?: number,
}): void | { [key: string]: any } {
	console.log("hi", lid);
	if (lid !== undefined) {
		// Importing!

		const l = await idb.meta.leagues.get(lid);
		console.log("hi", l);

		if (l) {
			return {
				lid,
				difficulty: l.difficulty,
				name: l.name,
				lastSelectedTid: l.tid,
			};
		}
	}

	let newLid = null;

	// Find most recent league and add one to the LID
	await idb.meta.leagues.iterate("prev", (l, shortCircuit) => {
		newLid = l.lid + 1;
		shortCircuit();
	});

	if (newLid === null) {
		newLid = 1;
	}

	let lastSelectedTid = await idb.meta.attributes.get("lastSelectedTid");
	if (typeof lastSelectedTid !== "number" || Number.isNaN(lastSelectedTid)) {
		lastSelectedTid = -1;
	}

	return {
		lid: undefined,
		difficulty: undefined,
		name: `League ${newLid}`,
		lastSelectedTid,
	};
}

export default {
	runBefore: [updateNewLeague],
};
