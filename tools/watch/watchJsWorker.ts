import { parentPort, workerData } from "node:worker_threads";
import { watch } from "rolldown";
import { rolldownConfig } from "../lib/rolldownConfig.ts";

// ?? is just so this can be run as a standalone script, for testing
const name = workerData?.name ?? "worker";

const makeWatcher = async () => {
	const config = rolldownConfig(name, {
		nodeEnv: "development",
		postMessage(message: any) {
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

let watcher = await makeWatcher();

parentPort?.on("message", async (message) => {
	if (message.type === "switchingSport") {
		await watcher.close();
	} else if (message.type === "newSport") {
		process.env.SPORT = message.sport;
		watcher = await makeWatcher();
	}
});
