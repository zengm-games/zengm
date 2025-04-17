import { idb } from "../../db/index.ts";
import { toUI } from "../../util/index.ts";
import { player } from "../index.ts";

const recomputeOvr = async () => {
	const ovrs: {
		pid: number;
		old: number;
		new: number;
		diff: number;
	}[] = [];

	const tx = idb.league.transaction("players", "readwrite");

	for await (const cursor of tx.store) {
		const p = cursor.value;

		const ratings = p.ratings.at(-1)!;
		const ovr = player.ovr(ratings);
		ovrs.push({
			pid: p.pid,
			old: ratings.ovr,
			new: ovr,
			diff: ovr - ratings.ovr,
		});

		if (ratings.ovr !== ovr) {
			ratings.ovr = ovr;
			await cursor.update(p);
		}
	}

	await tx.done;

	console.table(ovrs);
	await idb.cache.fill();
	await toUI("realtimeUpdate", [["firstRun"]]);
};

export default recomputeOvr;
