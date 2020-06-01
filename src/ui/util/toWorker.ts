import { promiseWorker } from ".";
import type api from "../../worker/api";

const toWorker = <
	Type extends "actions" | "main" | "playMenu" | "toolsMenu",
	Obj extends Type extends "main"
		? typeof api
		: Type extends "actions"
		? typeof api["actions"]
		: Type extends "playMenu"
		? typeof api["actions"]["playMenu"]
		: typeof api["actions"]["toolsMenu"]
>(
	type: Type,
	name: keyof Obj,
	...args: any[]
) => {
	return promiseWorker.postMessage([type, name, ...args]);
};

export default toWorker;
