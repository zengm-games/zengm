import { promiseWorker } from ".";
import type { WorkerAPICategory } from "../../worker";
import type api from "../../worker/api";

type API = typeof api;

const toWorker = <
	Type extends WorkerAPICategory,
	Name extends keyof API[Type],
	Func extends API[Type][Name],
>(
	type: Type,
	name: Name,
	// @ts-expect-error https://stackoverflow.com/q/70818342/786644
	param: Parameters<Func>[0],
	// @ts-expect-error
): Promise<ReturnType<Func>> => {
	return promiseWorker.postMessage([type, name, param]);
};

export default toWorker;
