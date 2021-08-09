import { idb, iterate } from "../../db";
import { toUI } from "../../util";
import { player } from "..";

const recomputeOvr = async () => {
	const ovrs: {
		pid: number;
		old: number;
		new: number;
		diff: number;
	}[] = [];

	const transaction = idb.league.transaction("players", "readwrite");

	await iterate(transaction.store, undefined, "prev", p => {
		const ratings = p.ratings.at(-1);
		const ovr = player.ovr(ratings);
		ovrs.push({
			pid: p.pid,
			old: ratings.ovr,
			new: ovr,
			diff: ovr - ratings.ovr,
		});

		if (ratings.ovr !== ovr) {
			ratings.ovr = ovr;
			return p;
		}
	});

	await transaction.done;

	console.table(ovrs);
	await idb.cache.fill();
	await toUI("realtimeUpdate", [["firstRun"]]);
};

export default recomputeOvr;
