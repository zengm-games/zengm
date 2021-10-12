import chokidar from "chokidar";
import * as build from "./buildFuncs";

const watchCSS = (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
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

export default watchCSS;
