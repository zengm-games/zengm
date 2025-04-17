import { Worker } from "node:worker_threads";
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

		eventEmitter.on("switchingSport", async () => {
			worker.postMessage({ type: "switchingSport" });
		});

		eventEmitter.on("newSport", (sport) => {
			worker.postMessage({ type: "newSport", sport });
		});
	}
};

// watchJs((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));
