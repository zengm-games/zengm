import { promiseWorker } from ".";
import type { WorkerAPICategory } from "../../worker";
import type api from "../../worker/api";

type API = typeof api;

// https://stackoverflow.com/a/70818666/786644
type ParametersUnconstrained<T> = T extends (...args: infer P) => any
	? P
	: never;
type ReturnTypeUnconstrained<T> = T extends (...args: any) => infer P
	? P
	: never;

const toWorker = <
	Type extends WorkerAPICategory,
	Name extends keyof API[Type],
	Func extends API[Type][Name],
>(
	type: Type,
	name: Name,
	param: ParametersUnconstrained<Func>[0],
): Promise<ReturnTypeUnconstrained<Func>> => {
	return promiseWorker.postMessage([type, name, param]);
};

export default toWorker;
