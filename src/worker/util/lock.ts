import { idb } from "../db/index.ts";
import toUI from "./toUI.ts";
import helpers from "./helpers.ts";
import local from "./local.ts";
import * as sim from "./sim.ts";

type Locks = {
	drafting: boolean;
	newPhase: boolean;
};

// These are transient variables that always reset to "false" on reload. See local.js for more.
const locks: Locks = {
	drafting: false,
	newPhase: false,
};

// Views and phase changes are mutually exclusive, because a phase change temporarily leaves data in an inconsistent state (like g.season being incremented before players get ratings for the new season). So views wait for any phase change to finish before running, and a phase change waits for any running views to finish before starting.
let numViewsRunning = 0;
let onViewsDone: (() => void)[] = [];
let onNewPhaseDone: (() => void)[] = [];

const resolveAll = (callbacks: (() => void)[]) => {
	for (const callback of callbacks) {
		callback();
	}
};

const runView = async <T>(cb: () => T | Promise<T>) => {
	// Loop in case another phase change starts before this gets a chance to run, like during auto play
	while (locks.newPhase) {
		const { promise, resolve } = Promise.withResolvers<void>();
		onNewPhaseDone.push(resolve);
		await promise;
	}

	numViewsRunning += 1;
	try {
		return await cb();
	} finally {
		numViewsRunning -= 1;
		if (numViewsRunning === 0) {
			const callbacks = onViewsDone;
			onViewsDone = [];
			resolveAll(callbacks);
		}
	}
};

// Long-running work that isn't covered by the locks above, like creating a
// league. A count, since these can overlap.
let numBusyTasks = 0;
let workerBusyInUI = false;

// Is the worker doing something that takes a while? The UI spins the logo when
// it is.
const isWorkerBusy = () =>
	sim.isActive() ||
	locks.newPhase ||
	locks.drafting ||
	local.autoPlayUntil !== undefined ||
	numBusyTasks > 0;

// Call after anything that could change isWorkerBusy, to keep the UI in sync
const updateWorkerBusy = async () => {
	const workerBusy = isWorkerBusy();
	if (workerBusy !== workerBusyInUI) {
		workerBusyInUI = workerBusy;
		await toUI("updateLocal", [{ workerBusy }]);
	}
};

// Mark the worker as busy while cb runs
const whileWorkerBusy = async <T>(cb: () => Promise<T>) => {
	numBusyTasks += 1;
	await updateWorkerBusy();
	try {
		return await cb();
	} finally {
		numBusyTasks -= 1;
		await updateWorkerBusy();
	}
};

const newPhaseUnlocked = () => {
	const callbacks = onNewPhaseDone;
	onNewPhaseDone = [];
	resolveAll(callbacks);
};

const reset = () => {
	for (const key of helpers.keys(locks)) {
		locks[key] = false;
	}
	newPhaseUnlocked();
	void updateWorkerBusy();
};

const get = (name: keyof Locks): boolean => {
	return locks[name];
};

const set = async (name: keyof Locks, value: boolean) => {
	if (locks[name] === value) {
		// Short circuit to prevent realtimeUpdate
		return;
	}

	locks[name] = value;

	if (name === "newPhase") {
		if (value) {
			local.undoLog.invalidate("newPhase");

			if (numViewsRunning > 0) {
				await new Promise<void>((resolve) => {
					onViewsDone.push(resolve);
				});
			}
		} else {
			newPhaseUnlocked();
		}
	}

	await updateWorkerBusy();
};

/**
 * Is there an undread message from the owner?
 *
 * Calls the callback function with either true or false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
const unreadMessage = async () => {
	const messages = await idb.merged.messages.getAll({ limit: 10 });

	return messages.some((message) => !message.read);
};

export default {
	reset,
	get,
	runView,
	set,
	unreadMessage,
	isWorkerBusy,
	updateWorkerBusy,
	whileWorkerBusy,
};
