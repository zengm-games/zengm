import { watch } from "chokidar";
import { parentPort } from "node:worker_threads";
import { buildCSS } from "../lib/buildFuncs.ts";

const filenames = ["build/gen/light.css", "build/gen/dark.css"];

const myBuildCSS = async () => {
	for (const filename of filenames) {
		parentPort!.postMessage({
			type: "start",
			filename,
		});
	}

	try {
		await buildCSS(true);
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

await myBuildCSS();

const watcher = watch("public/css", {});
watcher.on("change", myBuildCSS);
