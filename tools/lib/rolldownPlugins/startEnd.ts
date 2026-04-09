import fs from "node:fs/promises";
import path from "node:path";
import { stripVTControlCharacters } from "node:util";
import type { RolldownPlugin } from "rolldown";
import { FOLDER } from "../rolldownConfig.ts";

export const startEnd = ({
	name,
	postMessage,
	signal,
}: {
	name: "ui" | "worker";
	postMessage: (message: unknown) => void;
	signal: AbortSignal;
}): RolldownPlugin => {
	return {
		name: "start-end",

		buildStart() {
			if (signal.aborted) {
				return;
			}

			postMessage({
				type: "start",
			});
		},

		async buildEnd(error) {
			if (signal.aborted) {
				return;
			}

			if (error) {
				postMessage({
					type: "error",
					error,
				});

				const js = `throw new Error(${JSON.stringify(stripVTControlCharacters(error.message))})`;
				await fs.writeFile(path.join("build", FOLDER, `${name}.js`), js, {
					signal,
				});
			}
		},

		// This (and all the other signal.aborted stuff in this file) is a hacky fix for https://github.com/rolldown/rolldown/issues/8937
		generateBundle(outputOptions, bundle) {
			if (signal.aborted) {
				for (const key of Object.keys(bundle)) {
					delete bundle[key];
				}
			}
		},

		writeBundle() {
			if (signal.aborted) {
				return;
			}

			postMessage({
				type: "end",
			});
		},
	};
};
