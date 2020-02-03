import { idb, iterate } from "../../db";
import { overrides, toUI } from "../../util";

const recomputeHallOfFame = async () => {
	const transaction = idb.league.transaction("players", "readwrite");

	await iterate(transaction.store, undefined, "prev", p => {
		const madeHof = overrides.core.player.madeHof!(p);

		if (p.hof !== madeHof) {
			p.hof = madeHof;
			return p;
		}
	});

	await transaction.done;

	await idb.cache.fill();
	await toUI("realtimeUpdate", [["firstRun"]]);
};

export default recomputeHallOfFame;
