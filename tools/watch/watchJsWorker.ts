import { parentPort, workerData } from "node:worker_threads";
import { watch, type RolldownWatcher } from "rolldown";
import { rolldownConfig } from "../lib/rolldownConfig.ts";

// ?? is just so this can be run as a standalone script, for testing
const name = workerData?.name ?? "worker";

const makeWatcher = async () => {
	const config = rolldownConfig(name, {
		nodeEnv: "development",
		postMessage(message) {
			parentPort?.postMessage(message);
		},
	});

	const watcher = await watch(config);

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
		// Is it possible that the previous makeWatcher hasn't finished but will later, and we need an AbortController to handle that?
		if (watcher) {
			await watcher.close();
		}
	} else if (message.type === "newSport") {
		process.env.SPORT = message.sport;
		watcher = await makeWatcher();
	}
});

watcher = await makeWatcher();
