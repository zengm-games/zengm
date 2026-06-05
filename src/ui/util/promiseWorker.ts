import Bugsnag from "@bugsnag/browser";
import { PWBHost } from "promise-worker-bi";

const workerPath =
	process.env.NODE_ENV === "production"
		? `/gen/worker-${window.bbgmVersion}.js`
		: "/gen/worker.js";
const worker = window.useSharedWorker
	? new SharedWorker(workerPath, { type: "module" })
	: new Worker(workerPath, { type: "module" });

export const promiseWorker = new PWBHost(worker);
promiseWorker.registerError((error) => {
	Bugsnag.notify(error);

	console.error("Error from worker:");
	console.error(error);
});
