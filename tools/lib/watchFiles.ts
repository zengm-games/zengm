import { watch } from "chokidar";
import { copyFiles, genRev, reset, setTimestamps } from "./buildFuncs.ts";

// Would be better to only copy individual files on update, but this is fast enough

const watchFiles = (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	const watcher = watch(["public", "data", "node_modules/flag-icons"], {});

	const outFilename = "static files";

	const buildWatchFiles = () => {
		try {
			updateStart(outFilename);

			copyFiles(true);

			const rev = genRev();
			setTimestamps(rev, true);
			//minifyIndexHTML();

			updateEnd(outFilename);
		} catch (error) {
			updateError(outFilename, error);
		}
	};

	reset();
	buildWatchFiles();

	watcher.on("change", buildWatchFiles);
};

export default watchFiles;
