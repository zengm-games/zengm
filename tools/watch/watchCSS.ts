import { watch } from "chokidar";
import { buildCSS } from "../lib/buildFuncs.ts";

const watchCSS = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	const watcher = watch("public/css", {});

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

export default watchCSS;
