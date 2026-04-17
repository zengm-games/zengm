import { Worker } from "node:worker_threads";
import type { Spinners } from "./spinners.ts";
import type { Update } from "./cli.ts";
import type { Sport } from "../lib/getSport.ts";

export const watchJs = (
	initialSport: Sport,
	update: Update,
	eventEmitter: Spinners["eventEmitter"],
) => {
	for (const name of ["ui", "worker"]) {
		const filename = `build/gen/${name}.js`;

		const worker = new Worker(new URL("watchJsWorker.ts", import.meta.url), {
			workerData: {
				initialSport,
				name,
			},
		});

		worker.on("message", (message) => {
			if (message.type === "start") {
				update(filename, { status: "spin" });
			}
			if (message.type === "end") {
				update(filename, { status: "success" });
			}
			if (message.type === "error") {
				update(filename, { status: "error", error: message.error });
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

// watchJs((filename, info) => console.log(filename, info));
