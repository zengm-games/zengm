import type { Spinners } from "./spinners.ts";
import { watch } from "rolldown";
import { rolldownConfig } from "../lib/rolldownConfig.ts";

export const watchJs = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
	eventEmitter: Spinners["eventEmitter"],
) => {
	for (const name of ["ui", "worker"] as const) {
		const filename = `build/gen/${name}.js`;

		const makeWatcher = async () => {
			const config = rolldownConfig(name, {
				nodeEnv: "development",
				postMessage(message: any) {
					if (message.type === "start") {
						updateStart(filename);
					}
					if (message.type === "end") {
						updateEnd(filename);
					}
					if (message.type === "error") {
						updateError(filename, message.error);
					}
				},
			});

			const watcher = await watch(config);
			return watcher;
		};

		let watcher = await makeWatcher();

		eventEmitter.on("newSport", async () => {
			await watcher.close();
			//watcher = await makeWatcher();
		});
	}
};

/*import { Worker } from "node:worker_threads";
import type { Spinners } from "./spinners.ts";

export const watchJs = (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
	eventEmitter: Spinners["eventEmitter"],
) => {
	for (const name of ["ui", "worker"]) {
		const filename = `build/gen/${name}.js`;

		const worker = new Worker(new URL("watchJsWorker.ts", import.meta.url), {
			workerData: {
				name,
			},
		});

		worker.on("message", (message) => {
			if (message.type === "start") {
				updateStart(filename);
			}
			if (message.type === "end") {
				updateEnd(filename);
			}
			if (message.type === "error") {
				updateError(filename, message.error);
			}
		});

		eventEmitter.on("newSport", () => {
			worker.postMessage({ type: "newSport" });
		});
	}
};*/

// watchJs((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));
