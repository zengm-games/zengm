import Bugsnag from "@bugsnag/browser";
import { PWBHost } from "promise-worker-bi";

const workerPath =
	__NODE_ENV === "production"
		? `/gen/worker-${window.bbgmVersion}.js`
		: "/gen/worker.js";
const worker = window.useSharedWorker
	? new SharedWorker(workerPath, { type: "module" })
	: new Worker(workerPath, { type: "module" });

export const promiseWorker = new PWBHost(worker);

promiseWorker.addEventListener("error", ({ error }) => {
	Bugsnag.notify(error);

	console.error("Error from worker:");
	console.error(error);
});

// As of Chrome 152 (and possibly somewhat earlier versions), Chrome seems to kill a shared worker processe if it's idle for like 30 minutes, while not doing anything to the main process in the tab (no freeze/discard). This leaves no visible error message, but makes the entire app non functional. This code listens for the worker being killed and schedules a reload for the next time the page becomes visible. In theory could reactivate the worker instead, but state could be in a weird place
promiseWorker.addEventListener("close", () => {
	if (document.visibilityState === "visible") {
		window.location.reload();
	} else {
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				window.location.reload();
			}
		});
	}
});
