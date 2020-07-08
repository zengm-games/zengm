import { idb } from "../../db";
import { g, local, lock, updateStatus } from "../../util"; // Flush cache, disconnect from league database, and unset g.get("lid")

const close = async (disconnect?: boolean) => {
	const gameSim = lock.get("gameSim");
	local.autoPlayUntil = undefined;
	await lock.set("stopGameSim", true);
	await lock.set("gameSim", false); // Wait in case stuff is still happening (ugh)

	if (gameSim) {
		await new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	}

	if (g.get("lid") !== undefined && idb.league !== undefined) {
		if (local.leagueLoaded) {
			await updateStatus("Saving...");
			await idb.cache.flush();
			await updateStatus("Idle");
		}

		if (disconnect) {
			idb.cache.stopAutoFlush(); // Should probably "close" cache here too, but no way to do that now

			idb.league.close();
		}
	}

	if (disconnect) {
		lock.reset();
		local.reset();

		// Probably this should delete all other properties on g and reset it to GameAttributesNonLeague by calling helpers.resetG, but I don't want to mess with it now and maybe break stuff.
		// @ts-ignore
		g.setWithoutSavingToDB("lid", undefined);
	}
};

export default close;
