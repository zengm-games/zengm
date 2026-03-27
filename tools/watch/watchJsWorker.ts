import { parentPort, workerData } from "node:worker_threads";
import { watch, type RolldownWatcher } from "rolldown";
import { rolldownConfig } from "../lib/rolldownConfig.ts";

// ?? is just so this can be run as a standalone script, for testing
const name = workerData?.name ?? "worker";

let abortController: AbortController | undefined;

const makeWatcher = async () => {
	abortController?.abort();
	abortController = new AbortController();
	const { signal } = abortController;

	const config = rolldownConfig(name, {
		nodeEnv: "development",
		postMessage(message) {
			parentPort?.postMessage(message);
		},
	});

	const watcher = await watch(config);

	if (signal.aborted) {
		await watcher.close();
		return;
	}

	watcher.on("event", (event) => {
		if (event.code === "ERROR") {
			// In case "start" wasn't set from rolldown plugin yet
			parentPort?.postMessage({
				type: "start",
			});

			parentPort?.postMessage({
				type: "error",
				error: event.error,
			});
		}
	});

	return watcher;
};

let watcher: RolldownWatcher | undefined;

parentPort?.on("message", async (message) => {
	if (message.type === "switchingSport") {
		abortController?.abort();

		if (watcher) {
			await watcher.close();
			watcher = undefined;
		}
	} else if (message.type === "newSport") {
		process.env.SPORT = message.sport;
		watcher = await makeWatcher();
	}
});

watcher = await makeWatcher();
