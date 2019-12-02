// @flow

const chokidar = require("chokidar");
const build = require("./buildFuncs");

const watchCSS = (updateStart, updateEnd) => {
	const watcher = chokidar.watch("public/css", {});

	const filenames = ["build/gen/light.css", "build/gen/dark.css"];

	const buildCSS = () => {
		filenames.map(updateStart);
		build.buildCSS(true);
		filenames.map(updateEnd);
	};

	buildCSS();

	watcher.on("change", () => {
		buildCSS();
	});
};

module.exports = watchCSS;
