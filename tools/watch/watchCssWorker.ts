import { watch } from "chokidar";
import { parentPort } from "node:worker_threads";
import { buildCss } from "../build/buildCss.ts";

const filenames = ["build/gen/light.css", "build/gen/dark.css"];

const mybuildCss = async () => {
	for (const filename of filenames) {
		parentPort!.postMessage({
			type: "start",
			filename,
		});
	}

	try {
		await buildCss(true);
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

await mybuildCss();

const watcher = watch("public/css", {});
watcher.on("change", mybuildCss);
