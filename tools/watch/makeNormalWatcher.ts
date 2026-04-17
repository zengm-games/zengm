import { watch } from "chokidar";
import { type Spinners } from "./spinners.ts";
import type { Update } from "./cli.ts";
import type { Sport } from "../lib/getSport.ts";

export const makeNormalWatcher = ({
	build,
	outFilename,
	watchFiles,
}: {
	build: (sport: Sport, signal: AbortSignal) => void;
	outFilename: string;
	watchFiles: string | string[];
}) => {
	return async (
		initialSport: Sport,
		update: Update,
		eventEmitter: Spinners["eventEmitter"],
	) => {
		let currentSport = initialSport;

		let abortController: AbortController | undefined;

		const buildWrapped = async (sport: Sport) => {
			try {
				abortController?.abort();
				abortController = new AbortController();
				const { signal } = abortController;

				update(outFilename, { status: "spin" });

				await build(sport, signal);
				if (signal.aborted) {
					return;
				}

				update(outFilename, { status: "success" });
			} catch (error) {
				update(outFilename, { status: "error", error });
			}
		};

		const watcher = watch(watchFiles, {});
		watcher.on("change", async () => {
			await buildWrapped(currentSport);
		});
		eventEmitter.on("newSport", async (sport) => {
			currentSport = sport;
			await buildWrapped(currentSport);
		});
		eventEmitter.on("switchingSport", () => {
			abortController?.abort();
		});

		await buildWrapped(currentSport);
	};
};
