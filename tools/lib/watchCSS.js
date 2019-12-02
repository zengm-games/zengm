const chokidar = require("chokidar");
const build = require("./buildFuncs");

const watchCSS = (updateStart, updateEnd, updateError) => {
	const watcher = chokidar.watch("public/css", {});

	const filenames = ["build/gen/light.css", "build/gen/dark.css"];

	const buildCSS = () => {
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

	buildCSS();

	watcher.on("change", () => {
		buildCSS();
	});
};

module.exports = watchCSS;
