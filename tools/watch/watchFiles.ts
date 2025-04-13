import { watch } from "chokidar";
import { copyFiles } from "../build/copyFiles.ts";
import { generateVersionNumber } from "../build/generateVersionNumber.ts";
import { reset } from "../build/reset.ts";
import { setTimestamps } from "../build/setTimestamps.ts";
import { spinners, type Spinners } from "./spinners.ts";

// Would be better to only copy individual files on update, but this is fast enough

export const watchFiles = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
	eventEmitter: Spinners["eventEmitter"],
) => {
	const outFilename = "static files";

	let buildCount = 0;

	const buildWatchFiles = async () => {
		try {
			buildCount += 1;
			const initialBuildCount = buildCount;

			updateStart(outFilename);

			await copyFiles(true);

			if (buildCount !== initialBuildCount || spinners.switchingSport) {
				return;
			}

			const versionNumber = generateVersionNumber();
			await setTimestamps(versionNumber, true);

			if (buildCount !== initialBuildCount || spinners.switchingSport) {
				return;
			}

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
};
