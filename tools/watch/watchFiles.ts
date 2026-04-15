import { watch } from "chokidar";
import { copyFiles } from "../build/copyFiles.ts";
import { generateVersionNumber } from "../build/generateVersionNumber.ts";
import { type Spinners } from "./spinners.ts";
import { buildIndexHtml } from "../build/buildIndexHtml.ts";
import type { Update } from "./cli.ts";

// Would be better to only copy individual files on update, but this is fast enough

export const watchFiles = async (
	update: Update,
	eventEmitter: Spinners["eventEmitter"],
) => {
	const outFilename = "static files";

	let abortController: AbortController | undefined;

	const buildWatchFiles = async () => {
		try {
			abortController?.abort();
			abortController = new AbortController();
			const { signal } = abortController;

			update(outFilename, { status: "spin" });

			await copyFiles(true, signal);

			if (signal.aborted) {
				return;
			}

			const versionNumber = generateVersionNumber();
			await buildIndexHtml({ signal, versionNumber, watch: true });

			if (signal.aborted) {
				return;
			}

			update(outFilename, { status: "success" });
		} catch (error) {
			update(outFilename, { status: "error", error });
		}
	};

	const watcher = watch(["public", "data", "node_modules/flag-icons"], {});
	watcher.on("change", buildWatchFiles);
	eventEmitter.on("newSport", buildWatchFiles);
	eventEmitter.on("switchingSport", () => {
		abortController?.abort();
	});

	await buildWatchFiles();
};
