import { promiseWorker } from ".";
import type { WorkerAPICategory } from "../../worker";
import type api from "../../worker/api";

type API = typeof api;

const toWorker = <Type extends WorkerAPICategory, Name extends keyof API[Type]>(
	type: Type,
	name: Name,
	// @ts-expect-error https://stackoverflow.com/q/70818342/786644
	param: Parameters<API[Type][Name]>[0],
) => {
	return promiseWorker.postMessage([type, name, param]);
};

export default toWorker;
