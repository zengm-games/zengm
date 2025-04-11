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
	return watcher;
};

let watcher = await makeWatcher();

parentPort?.on("message", async (message) => {
	if (message.type === "newSport") {
		await watcher.close();
		watcher = await makeWatcher();
	}
});
