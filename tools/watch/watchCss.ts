import { Worker } from "node:worker_threads";

// This import is needed for https://github.com/parcel-bundler/lightningcss/issues/892
import "lightningcss";

export const watchCss = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	const worker = new Worker(new URL("watchCssWorker.ts", import.meta.url));

	worker.on("message", (message) => {
		if (message.type === "start") {
			updateStart(message.filename);
		}
		if (message.type === "end") {
			updateEnd(message.filename);
		}
		if (message.type === "error") {
			updateError(message.filename, message.error);
		}
	});
};
