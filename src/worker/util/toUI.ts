import { promiseWorker } from "./index.ts";
import type api from "../../ui/api/index.ts";
import type { Conditions } from "../../common/types.ts";

const toUI = <Name extends keyof typeof api>(
	name: Name,
	args: Parameters<(typeof api)[Name]>,
	conditions: Conditions = {},
): Promise<ReturnType<(typeof api)[Name]>> => {
	if (process.env.NODE_ENV === "test") {
		// @ts-expect-error
		return Promise.resolve();
	}

	return promiseWorker.postMessage([name, ...args], conditions.hostID);
};

export default toUI;
