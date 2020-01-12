import { promiseWorker } from ".";
import { Conditions } from "../../common/types";

const toUI = (args: any[], conditions: Conditions = {}): Promise<any> => {
	if (typeof it === "function") {
		return Promise.resolve();
	}

	return promiseWorker.postMessage(args, conditions.hostID);
};

export default toUI;
