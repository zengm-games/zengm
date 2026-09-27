import { promiseWorker } from "./promiseWorker.ts";
import type api from "../../ui/api/index.ts";
import type { Conditions } from "../../common/types.ts";
import lock from "./lock.ts";

const toUI = <Name extends keyof typeof api>(
	name: Name,
	args: Parameters<(typeof api)[Name]>,
	conditions: Conditions = {},
): Promise<ReturnType<(typeof api)[Name]>> => {
	// Views wait for the newPhase lock to be released before running, so awaiting a realtimeUpdate while holding the lock would deadlock
	if (name === "realtimeUpdate" && lock.get("newPhase")) {
		throw new Error("Can't call realtimeUpdate while newPhase is locked");
	}

	if (__NODE_ENV === "test") {
		// @ts-expect-error
		return Promise.resolve();
	}

	return promiseWorker.postMessage([name, ...args], conditions.hostID) as any;
};

export default toUI;
