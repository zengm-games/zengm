import { watch } from "chokidar";
import { parentPort } from "node:worker_threads";
import { buildCss } from "../build/buildCss.ts";

const filenames = ["build/gen/light.css", "build/gen/dark.css"];

let abortController: AbortController | undefined;

const myBuildCss = async () => {
	try {
		abortController?.abort();
		abortController = new AbortController();
		const { signal } = abortController;

		for (const filename of filenames) {
			parentPort!.postMessage({
				type: "start",
				filename,
			});
		}

		await buildCss(true, signal);
		if (signal.aborted) {
			return;
		}

		for (const filename of filenames) {
			parentPort!.postMessage({
				type: "end",
				filename,
			});
		}
	} catch (error) {
		for (const filename of filenames) {
			parentPort!.postMessage({
				type: "error",
				filename,
				error,
			});
		}
	}
};

await myBuildCss();

const watcher = watch("public/css", {});
watcher.on("change", myBuildCss);

// No need to listen for switchingSport because CSS does not depend on sport
