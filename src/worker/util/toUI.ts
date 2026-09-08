import { promiseWorker } from "./promiseWorker.ts";
import type api from "../../ui/api/index.ts";
import type { Conditions } from "../../common/types.ts";

const toUI = <Name extends keyof typeof api>(
	name: Name,
	args: Parameters<(typeof api)[Name]>,
	conditions: Conditions = {},
) => {
	if (__NODE_ENV === "test") {
		return Promise.resolve();
	}

	return promiseWorker.postMessage(
		[name, ...args],
		conditions.hostID,
	) as Promise<ReturnType<(typeof api)[Name]>>;
};

export default toUI;
