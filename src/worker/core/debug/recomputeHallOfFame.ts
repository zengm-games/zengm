import { idb, iterate } from "../../db";
import { toUI } from "../../util";
import { player } from "..";

const recomputeHallOfFame = async () => {
	const transaction = idb.league.transaction("players", "readwrite");

	await iterate(transaction.store, undefined, "prev", p => {
		const made = player.madeHof(p);

		const prev = p.hof;
		if (made) {
			p.hof = 1;
		} else {
			delete p.hof;
		}

		if (p.hof !== prev) {
			return p;
		}
	});

	await transaction.done;

	await idb.cache.fill();
	await toUI("realtimeUpdate", [["firstRun"]]);
};

export default recomputeHallOfFame;
