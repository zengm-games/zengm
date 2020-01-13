import { idb } from "../../db";
import { overrides, toUI } from "../../util";

const recomputeOvr = async () => {
	const ovrs: any[] = [];
	await idb.league.tx("players", "readwrite", async tx => {
		await tx.players.iterate(p => {
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
				return p;
			}
		});
	});

	console.table(ovrs);
	await idb.cache.fill();
	await toUI(["realtimeUpdate", ["firstRun"]]);
};

export default recomputeOvr;
