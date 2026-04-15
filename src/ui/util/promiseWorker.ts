import Bugsnag from "@bugsnag/browser";
import { PWBHost } from "promise-worker-bi";

const workerPath =
	process.env.NODE_ENV === "production"
		? `/gen/worker-${window.bbgmVersion}.js`
		: "/gen/worker.js";
let worker: SharedWorker | Worker;
try {
	worker = window.useSharedWorker
		? new SharedWorker(workerPath, { type: "module" })
		: new Worker(workerPath, { type: "module" });
} catch {
	// Chrome <83 has an error when using module type
	worker = window.useSharedWorker
		? new SharedWorker(workerPath)
		: new Worker(workerPath);
}

export const promiseWorker = new PWBHost(worker);
promiseWorker.registerError((error) => {
	Bugsnag.notify(error);

	console.error("Error from worker:");
	console.error(error);
});
