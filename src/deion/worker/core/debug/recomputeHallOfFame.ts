import { idb } from "../../db";
import { overrides, toUI } from "../../util";

const recomputeHallOfFame = async () => {
	const transaction = idb.league.transaction("players", "readwrite");

	let cursor = await transaction.store.openCursor(undefined, "prev");
	while (cursor) {
		const p = cursor.value;

		if (!overrides.core.player.madeHof) {
			throw new Error("Missing overrides.core.player.madeHof");
		}
		const madeHof = overrides.core.player.madeHof(p);

		if (p.hof !== madeHof) {
			p.hof = madeHof;
			cursor.update(p);
		}

		cursor = await cursor.continue();
	}

	await transaction.done;

	await idb.cache.fill();
	await toUI(["realtimeUpdate", ["firstRun"]]);
};

export default recomputeHallOfFame;
