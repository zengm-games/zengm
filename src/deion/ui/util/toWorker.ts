import { promiseWorker } from ".";
import api from "../../worker/api";

const toWorker = <Type extends "actions" | "main" | "playMenu" | "toolsMenu">(
	type: Type,
	name: Type extends "main"
		? keyof typeof api
		: Type extends "actions"
		? keyof typeof api["actions"]
		: Type extends "playMenu"
		? keyof typeof api["actions"]["playMenu"]
		: keyof typeof api["actions"]["toolsMenu"],
	...args: any[]
) => {
	return promiseWorker.postMessage([type, name, ...args]);
};

export default toWorker;
