import { idb } from "../../db";
import { overrides, toUI } from "../../util";

const recomputeOvr = async () => {
	const ovrs: {
		pid: number;
		old: number;
		new: number;
		diff: number;
	}[] = [];

	const transaction = idb.league.transaction("players", "readwrite");

	let cursor = await transaction.store.openCursor(undefined, "prev");
	while (cursor) {
		const p = cursor.value;

		const ratings = p.ratings[p.ratings.length - 1];

		if (!overrides.core.player.ovr) {
			throw new Error("Missing overrides.core.player.ovr");
		}

		const ovr = overrides.core.player.ovr(ratings);
		ovrs.push({
			pid: p.pid,
			old: ratings.ovr,
			new: ovr,
			diff: ovr - ratings.ovr,
		});

		if (ratings.ovr !== ovr) {
			ratings.ovr = ovr;
			cursor.update(p);
		}

		cursor = await cursor.continue();
	}

	await transaction.done;

	console.table(ovrs);
	await idb.cache.fill();
	await toUI(["realtimeUpdate", ["firstRun"]]);
};

export default recomputeOvr;
