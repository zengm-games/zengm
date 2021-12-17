const chokidar = require("chokidar");
const build = require("./buildFuncs");

const watchCSS = async (updateStart, updateEnd, updateError) => {
	const watcher = chokidar.watch("public/css", {});

	const filenames = ["build/gen/light.css", "build/gen/dark.css"];

	const buildCSS = async () => {
		filenames.map(updateStart);
		try {
			build.buildCSS(true);
			filenames.map(updateEnd);
		} catch (error) {
			for (const filename of filenames) {
				updateError(filename, error);
			}
		}
	};

	await buildCSS();

	watcher.on("change", buildCSS);
};

module.exports = watchCSS;
