import fs from "node:fs/promises";
import { parentPort } from "node:worker_threads";
import { watch } from "rolldown";
import { sportFunctions } from "../lib/rolldownPlugins/sportFunctions.ts";

await watch({
	input: "src/ui/index.tsx",
	output: {
		entryFileNames: "ui.js",
		dir: "build/gen",
	},
	plugins: [
		sportFunctions("development", "basketball"),
		{
			name: "start-end",
			buildStart() {
				parentPort!.postMessage("Press ctrl+c now to see panic");
			},
			writeBundle() {
				parentPort!.postMessage("Too late!");
			},
		},
	],
	external() {},
});
