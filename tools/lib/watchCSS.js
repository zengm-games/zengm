const chokidar = require("chokidar");

const watchCSS = async (updateStart, updateEnd, updateError) => {
	const { buildCSS } = await import("./buildFuncs.mjs");

	const watcher = chokidar.watch("public/css", {});

	const filenames = ["build/gen/light.css", "build/gen/dark.css"];

	const myBuildCSS = async () => {
		filenames.map(updateStart);
		try {
			await buildCSS(true);
			filenames.map(updateEnd);
		} catch (error) {
			for (const filename of filenames) {
				updateError(filename, error);
			}
		}
	};

	await myBuildCSS();

	watcher.on("change", myBuildCSS);
};

module.exports = watchCSS;
