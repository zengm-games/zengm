// @flow

import { idb } from "../../db";
import { overrides, toUI } from "../../util";

const recomputeOvr = async () => {
	await idb.league.tx("players", "readwrite", async tx => {
		await tx.players.iterate(p => {
			const ratings = p.ratings[p.ratings.length - 1];
			if (!overrides.core.player.ovr) {
				throw new Error("Missing overrides.core.player.ovr");
			}
			const ovr = overrides.core.player.ovr(ratings);
			console.log(p.pid, ratings.ovr, ovr);
			if (ratings.ovr !== ovr) {
				ratings.ovr = ovr;
				return p;
			}
		});
	});

	await idb.cache.fill();

	await toUI(["realtimeUpdate", ["firstRun"]]);
};

export default recomputeOvr;
