import { promiseWorker } from "./promiseWorker.ts";
import type api from "../../ui/api/index.ts";
import type { Conditions } from "../../common/types.ts";

// When conditions.hostID is set, the message goes to that tab only, and the returned promise rejects with a HostClosedError if that tab closes before responding. Broadcasts (no hostID) can't get that error.
//
// Never use this to ask the user something (a confirm dialog or similar) in the middle of worker code. The league could change while the dialog is open, and the work would continue in the wrong league. Ask in the UI before calling the worker instead.
export const toUI = <Name extends keyof typeof api>(
	name: Name,
	args: Parameters<(typeof api)[Name]>,
	conditions: Conditions = {},
): Promise<ReturnType<(typeof api)[Name]>> => {
	if (__NODE_ENV === "test") {
		// @ts-expect-error
		return Promise.resolve();
	}

	return promiseWorker.postMessage([name, ...args], conditions.hostID) as any;
};

// promise-worker-bi identifies this error by name rather than by class. Only check it in the worker, because structured clone resets non-standard error names, so it arrives in the UI as a plain "Error"
const isHostClosedError = (error: unknown) =>
	error instanceof Error && error.name === "HostClosedError";

// For messages nobody waits for. If the target tab closed, there is nobody left to show the message to, so that's ignored rather than reported as an unhandled rejection. Any other error is still reported.
export const toUIWithoutWaiting = <Name extends keyof typeof api>(
	name: Name,
	args: Parameters<(typeof api)[Name]>,
	conditions: Conditions = {},
) => {
	toUI(name, args, conditions).catch((error: unknown) => {
		if (!isHostClosedError(error)) {
			throw error;
		}
	});
};
