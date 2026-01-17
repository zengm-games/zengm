import { watch } from "chokidar";
import { copyFiles } from "../build/copyFiles.ts";
import { generateVersionNumber } from "../build/generateVersionNumber.ts";
import { reset } from "../build/reset.ts";
import { setTimestamps } from "../build/setTimestamps.ts";
import { type Spinners } from "./spinners.ts";

// Would be better to only copy individual files on update, but this is fast enough

export const watchFiles = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
	eventEmitter: Spinners["eventEmitter"],
) => {
	const outFilename = "static files";

	let abortController: AbortController | undefined;

	const buildWatchFiles = async () => {
		try {
			abortController?.abort();
			abortController = new AbortController();
			const { signal } = abortController;

			updateStart(outFilename);

			await copyFiles(true, signal);

			if (signal.aborted) {
				return;
			}

			const versionNumber = generateVersionNumber();
			await setTimestamps(versionNumber, true, signal);

			if (signal.aborted) {
				return;
			}

			abortController = undefined;

			updateEnd(outFilename);
		} catch (error) {
			updateError(outFilename, error);
		}
	};

	await reset();
	await buildWatchFiles();

	const watcher = watch(["public", "data", "node_modules/flag-icons"], {});
	watcher.on("change", buildWatchFiles);
	eventEmitter.on("newSport", buildWatchFiles);
	eventEmitter.on("switchingSport", () => {
		abortController?.abort();
	});
};
