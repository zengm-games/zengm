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

export { default as ads } from "./ads.ts";
export { default as analyticsEvent } from "./analyticsEvent.ts";
export { default as autoPlayDialog } from "./autoPlayDialog.tsx";
export { default as compareVersions } from "./compareVersions.ts";
export { default as confirm } from "./confirm.tsx";
export { default as confirmDeleteAllLeagues } from "./confirmDeleteAllLeagues.tsx";
export { default as downloadFile } from "./downloadFile.ts";
export { default as genStaticPage } from "./genStaticPage.tsx";
export { default as getCol } from "../../common/getCol.ts";
export { default as getCols } from "../../common/getCols.ts";
export { default as getScript } from "./getScript.ts";
export { default as gradientStyleFactory } from "./gradientStyleFactory.ts";
export { default as groupAwards } from "./groupAwards.ts";
export { default as helpers } from "./helpers.ts";
export { default as initView } from "./initView.ts";
export {
	local,
	localActions,
	useLocal,
	useLocalActions,
	useLocalPartial,
} from "./local.ts";
export { default as leagueNotFoundMessage } from "./leagueNotFoundMessage.tsx";
export { default as logEvent } from "./logEvent.ts";
export { default as menuItems } from "./menuItems.tsx";
export { default as notify } from "./notify.ts";
export { default as prefixStatOpp } from "./prefixStatOpp.ts";
export { default as processLiveGameEvents } from "./processLiveGameEvents.ts";
export { default as processPlayerStats } from "./processPlayerStats.ts";
export { default as realtimeUpdate } from "./realtimeUpdate.ts";
export { default as requestPersistentStorage } from "./requestPersistentStorage.ts";
export { default as resetFileInput } from "./resetFileInput.ts";
export { default as routes } from "./routes.ts";
export { default as safeLocalStorage } from "./safeLocalStorage.ts";
export { default as sanitize } from "./sanitize.ts";
export { default as takeScreenshot } from "./takeScreenshot.ts";
export { default as toWorker } from "./toWorker.ts";
export { default as unregisterServiceWorkers } from "./unregisterServiceWorkers.ts";
