import { promiseWorker } from ".";

const toWorker = (
	type: "actions" | "main" | "playMenu" | "toolsMenu",
	name: string,
	...args: any[]
) => {
	return promiseWorker.postMessage([type, name, ...args]);
};

export default toWorker;
