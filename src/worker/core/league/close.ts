import { idb } from "../../db/index.ts";
import { g, local, lock, sim, updateStatus } from "../../util/index.ts";
import { cleanupAutoPlay } from "../league/autoPlay.ts";

const flushIfDirty = async () => {
	if (local.leagueLoaded && idb.cache.dirty) {
		await updateStatus("Saving...");
		await idb.cache.flush();
		await updateStatus();
	}
};

// Stop auto play and game sims. Phase changes can't be stopped, so callers deal with those.
const stopBackgroundWork = async () => {
	const simWasActive = sim.isActive();
	cleanupAutoPlay();
	await sim.abort();

	// Wait in case stuff is still happening (ugh)
	if (simWasActive) {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	}
};

const isLeagueOpen = () =>
	g.get("lid") !== undefined && idb.league !== undefined;

// Stop auto play and game sims, and save, but keep the league loaded. A running phase change keeps going.
export const stopAndSave = async () => {
	await stopBackgroundWork();

	if (isLeagueOpen()) {
		await flushIfDirty();
	}
};

// Stop auto play and game sims, wait for any phase change, save, disconnect from league database, and unset g.get("lid")
export const close = async () => {
	await stopBackgroundWork();

	if (isLeagueOpen()) {
		// A phase change can't be stopped partway through, so before disconnecting, let it finish in this league and save what it did. Loop, because some play menu options run several phase changes in a row, and the next one could start while this is saving.
		//
		// This only waits for the newPhase lock. finalize releases the lock before its last steps (processScheduledEvents, realtimeUpdate, continuing auto play), and a play menu option can start another phase change after those, so that work can still run after the disconnect. Waiting for it would deadlock: when a league switch is loading, the UI holds the worker's realtimeUpdate until the switch is done.
		do {
			while (lock.get("newPhase")) {
				await updateStatus("Waiting for the phase change to finish...");
				await lock.newPhaseDone();
			}
			await flushIfDirty();
		} while (lock.get("newPhase"));

		// Nothing awaits between the check above and lock.reset() below, so no phase change can start in between
		idb.cache.stopAutoFlush();

		// Should probably "close" cache here too, but no way to do that now
		idb.league.close();
	}

	sim.reset();
	lock.reset();
	local.reset();

	// Probably this should delete all other properties on g and reset it to GameAttributesNonLeague by calling helpers.resetG, but I don't want to mess with it now and maybe break stuff.
	// @ts-expect-error
	g.setWithoutSavingToDB("lid", undefined);
};
