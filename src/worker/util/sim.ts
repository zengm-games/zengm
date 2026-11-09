import local from "./local.ts";
import lock from "./lock.ts";
import toUI from "./toUI.ts";
import updatePlayMenu from "./updatePlayMenu.ts";
import updateStatus from "./updateStatus.ts";

// Lifecycle of a game sim or free agency sim loop:
//
//   idle --run--> running --requestStop--> stopping
//     ^              |                        |
//     +-run.finish---+-------run.finish-------+
//
// Only the sim loop itself finishes its run (or abort/reset, which tear everything down). So while the state is "stopping", the old loop is still finishing its current day, and a new sim can't start until it's done.
type SimState = "idle" | "running" | "stopping";

// A handle to one sim run, given to the sim loop by sim.run. Only the loop uses it. A run that is no longer current (it already finished, or it was aborted) can't affect a newer run.
export type SimRun = {
	// Checked by the sim loop before each day
	shouldContinue: () => boolean;

	// Called by the sim loop when it stops, whether it finished or was asked to stop. This needs to happen before anything that could start the next sim, like a phase change during auto play.
	finish: () => Promise<void>;
};

let state: SimState = "idle";
let currentRun: SimRun | undefined;

// The state changes synchronously, before anything is awaited, so callers that need the new state to take effect immediately (run, requestStop) can call this without awaiting. Keep it that way.
const setState = async (newState: SimState) => {
	const wasActive = state !== "idle";
	state = newState;
	const isActive = state !== "idle";

	if (isActive !== wasActive) {
		if (isActive) {
			local.undoLog.invalidate("advanceDay");
		}

		await toUI("updateLocal", [
			{
				gameSimInProgress: isActive,
			},
		]);
		await lock.updateWorkerBusy();
	}
};

// Start a sim loop if nothing else is going on, otherwise do nothing
export const run = async (cb: (run: SimRun) => Promise<void>) => {
	// The check and the state change happen synchronously, otherwise there would be a race condition if anything else async happened
	if (lock.get("newPhase") || state !== "idle") {
		return;
	}

	const thisRun: SimRun = {
		shouldContinue: () => currentRun === thisRun && state === "running",
		finish: async () => {
			if (currentRun === thisRun) {
				currentRun = undefined;
				await setState("idle");
			}
		},
	};
	currentRun = thisRun;
	void setState("running");

	try {
		await cb(thisRun);
	} finally {
		// Normally the loop already finished its run and updated the UI itself. But if the loop threw, finish it here so the sim isn't stuck as running/stopping forever, and update the play menu and status that the loop never got to update.
		if (currentRun === thisRun) {
			await thisRun.finish();
			await updatePlayMenu();
			await updateStatus();
		}
	}
};

// Ask the running sim loop to stop after its current day. No-op if no sim is running.
export const requestStop = () => {
	if (state === "running") {
		// Not awaited, so the stop takes effect synchronously. running -> stopping doesn't change whether a sim is active, so there's no UI update to wait for anyway.
		void setState("stopping");
	}
};

// Stop immediately rather than waiting for the sim loop to finish its day, like when closing a league. Any running loop sees its run is no longer current and stops at its next check.
export const abort = async () => {
	currentRun = undefined;
	await setState("idle");
};

// Like abort, but without updating the UI, for when the UI is getting reset anyway
export const reset = () => {
	currentRun = undefined;
	state = "idle";
};

// Is a sim loop running or finishing up its current day?
export const isActive = () => state !== "idle";

export const getState = () => state;
