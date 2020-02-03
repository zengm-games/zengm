import { promiseWorker } from ".";
import api from "../../ui/api";
import { Conditions } from "../../common/types";

const toUI = <Name extends keyof typeof api>(
	name: Name,
	args: Parameters<typeof api[Name]>,
	conditions: Conditions = {},
): Promise<ReturnType<typeof api[Name]>> => {
	if (typeof it === "function") {
		// @ts-ignore
		return Promise.resolve();
	}

	return promiseWorker.postMessage([name, ...args], conditions.hostID);
};

export default toUI;
