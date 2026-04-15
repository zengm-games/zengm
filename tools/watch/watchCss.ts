import { Worker } from "node:worker_threads";

// This import is needed for https://github.com/parcel-bundler/lightningcss/issues/892
import "lightningcss";
import type { Update } from "./cli.ts";

export const watchCss = async (update: Update) => {
	const worker = new Worker(new URL("watchCssWorker.ts", import.meta.url));

	worker.on("message", (message) => {
		if (message.type === "start") {
			update(message.filename, { status: "spin" });
		}
		if (message.type === "end") {
			update(message.filename, { status: "success" });
		}
		if (message.type === "error") {
			update(message.filename, { status: "error", error: message.error });
		}
	});
};
