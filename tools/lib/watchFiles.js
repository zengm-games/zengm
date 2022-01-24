const chokidar = require("chokidar");
const build = require("./buildFuncs");

// Would be better to only copy individual files on update, but this is fast enough

const watchFiles = (updateStart, updateEnd, updateError) => {
	const watcher = chokidar.watch(
		["public", "data", "node_modules/flag-icons"],
		{},
	);

	const outFilename = "static files";

	const buildWatchFiles = () => {
		try {
			updateStart(outFilename);

			build.copyFiles(true);

			const rev = build.genRev();
			build.setTimestamps(rev, true);
			//build.minifyIndexHTML();

			updateEnd(outFilename);
		} catch (error) {
			updateError(outFilename, error);
		}
	};

	build.reset();
	buildWatchFiles();

	watcher.on("change", buildWatchFiles);
};

module.exports = watchFiles;
