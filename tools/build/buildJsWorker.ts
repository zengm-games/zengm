import { build } from "rolldown";
import { parentPort, workerData } from "node:worker_threads";
import { rolldownConfig } from "../lib/rolldownConfig.ts";

const LODASH_BLACKLIST = [
	/^lodash$/,
	/^lodash-es/,

	// lodash/debounce and lodash/memoize are used by visx
	/^lodash\/(?!debounce|memoize)/,
];

const BLACKLIST = {
	ui: [...LODASH_BLACKLIST, /\/worker/],
	worker: [...LODASH_BLACKLIST, /\/ui/, /^react/],
};

const buildFile = async (name: "ui" | "worker", versionNumber: string) => {
	const config = rolldownConfig(name, {
		nodeEnv: "production",
		blacklistOptions: BLACKLIST[name],
		versionNumber,
	});
	await build(config);

	parentPort!.postMessage("done");
};

const { name, versionNumber } = workerData;

await buildFile(name, versionNumber);
