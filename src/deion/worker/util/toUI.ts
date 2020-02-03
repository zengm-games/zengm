import { promiseWorker } from ".";
import api from "../../ui/api";
import { Conditions } from "../../common/types";

const toUI = <Name extends keyof typeof api>(
	name: Name,
	args: any[] = [],
	conditions: Conditions = {},
): Promise<any> => {
	if (typeof it === "function") {
		return Promise.resolve();
	}

	return promiseWorker.postMessage([name, ...args], conditions.hostID);
};

export default toUI;
