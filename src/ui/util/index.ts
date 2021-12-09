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
} catch (error) {
	// Chrome <83 has an error when using module type
	worker = window.useSharedWorker
		? new SharedWorker(workerPath)
		: new Worker(workerPath);
}

export const promiseWorker = new PWBHost(worker);
promiseWorker.registerError(error => {
	Bugsnag.notify(error);

	console.error("Error from worker:");
	console.error(error);
});

export { default as ads } from "./ads";
export { default as autoPlayDialog } from "./autoPlayDialog";
export { default as compareVersions } from "./compareVersions";
export { default as confirm } from "./confirm";
export { default as confirmDeleteAllLeagues } from "./confirmDeleteAllLeagues";
export { default as downloadFile } from "./downloadFile";
export { default as genStaticPage } from "./genStaticPage";
export { default as getCols } from "../../common/getCols";
export { default as getScript } from "./getScript";
export { default as gradientStyleFactory } from "./gradientStyleFactory";
export { default as groupAwards } from "./groupAwards";
export { default as helpers } from "./helpers";
export { default as initView } from "./initView";
export {
	local,
	localActions,
	useLocal,
	useLocalActions,
	useLocalShallow,
} from "./local";
export { default as leagueNotFoundMessage } from "./leagueNotFoundMessage";
export { default as logEvent } from "./logEvent";
export { default as menuItems } from "./menuItems";
export { default as notify } from "./notify";
export { default as prefixStatOpp } from "./prefixStatOpp";
export { default as processLiveGameEvents } from "./processLiveGameEvents";
export { default as processPlayerStats } from "./processPlayerStats";
export { default as realtimeUpdate } from "./realtimeUpdate";
export { default as requestPersistentStorage } from "./requestPersistentStorage";
export { default as resetFileInput } from "./resetFileInput";
export { default as routes } from "./routes";
export { default as safeLocalStorage } from "./safeLocalStorage";
export { default as takeScreenshot } from "./takeScreenshot";
export { default as toWorker } from "./toWorker";
export { default as unregisterServiceWorkers } from "./unregisterServiceWorkers";
