import { parentPort, workerData } from "node:worker_threads";
import { watch } from "rolldown";
import { rolldownConfig } from "../lib/rolldownConfig.ts";

// ?? is just so this can be run as a standalone script, for testing
const name = workerData?.name ?? "worker";

const makeWatcher = () => {
	const abortController = new AbortController();
	const { signal } = abortController;

	const config = rolldownConfig(name, {
		nodeEnv: "development",
		postMessage(message) {
			parentPort?.postMessage(message);
		},
		signal,
	});

	// Do this async so the abortController can be returned synchronously and therefore can be aborted before the watcher is done being created
	(async () => {
		const watcher = await watch(config);

		if (signal.aborted) {
			await watcher.close();
			return;
		}

		signal.addEventListener("abort", async () => {
			await watcher.close();
		});

		watcher.on("event", (event) => {
			if (signal.aborted) {
				return;
			}

			if (event.code === "ERROR") {
				// In case "start" wasn't set from rolldown plugin yet
				parentPort?.postMessage({
					type: "start",
				});

				parentPort?.postMessage({
					type: "error",
					error: event.error,
				});

				// https://rollupjs.org/javascript-api/#rollup-watch and https://rolldown.rs/reference/Function.watch say to do this
				event.result.close();
			} else if (event.code === "BUNDLE_END") {
				// https://rollupjs.org/javascript-api/#rollup-watch and https://rolldown.rs/reference/Function.watch say to do this
				event.result.close();
			}
		});
	})();

	return abortController;
};

let abortController = makeWatcher();

parentPort?.on("message", async (message) => {
	if (message.type === "switchingSport") {
		abortController.abort();
	} else if (message.type === "newSport") {
		process.env.SPORT = message.sport;
		abortController.abort(); // Maybe not necessary
		abortController = makeWatcher();
	}
});
