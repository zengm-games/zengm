import { parentPort, workerData } from "node:worker_threads";
import { watch } from "rolldown";
import { rolldownConfig } from "../lib/rolldownConfig.ts";
import type { Sport } from "../lib/getSport.ts";

// ?? is just so this can be run as a standalone script, for testing
const name = workerData?.name ?? "worker";
const initialSport: Sport = workerData?.initialSport ?? "basketball";

const makeWatcher = (sport: Sport) => {
	const abortController = new AbortController();
	const { signal } = abortController;

	const config = rolldownConfig(sport, name, {
		nodeEnv: "development",
		postMessage(message) {
			parentPort?.postMessage(message);
		},
		signal,
	});

	const watcher = watch(config);

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

	return abortController;
};

let abortController = makeWatcher(initialSport);

parentPort?.on("message", async (message) => {
	if (message.type === "switchingSport") {
		abortController.abort();
	} else if (message.type === "newSport") {
		abortController.abort(); // Maybe not necessary
		abortController = makeWatcher(message.sport);
	}
});
