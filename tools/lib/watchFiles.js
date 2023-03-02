const chokidar = require("chokidar");

// Would be better to only copy individual files on update, but this is fast enough

const watchFiles = async (updateStart, updateEnd, updateError) => {
	const { copyFiles, genRev, reset, setTimestamps } = await import(
		"./buildFuncs.mjs"
	);

	const watcher = chokidar.watch(
		["public", "data", "node_modules/flag-icons"],
		{},
	);

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

module.exports = watchFiles;
