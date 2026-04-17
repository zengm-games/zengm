import { build } from "rolldown";
import { parentPort, workerData } from "node:worker_threads";
import { rolldownConfig } from "../lib/rolldownConfig.ts";
import type { Sport } from "../lib/getSport.ts";

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

const buildFile = async (
	sport: Sport,
	name: "ui" | "worker",
	versionNumber: string,
) => {
	let modulepreloadFilenames: string[] | undefined;
	const config = rolldownConfig(sport, name, {
		nodeEnv: "production",
		blacklistOptions: BLACKLIST[name],
		versionNumber,
		onModulepreloadFilenames: (filenames) => {
			modulepreloadFilenames = filenames;
		},
	});
	await build(config);

	if (modulepreloadFilenames === undefined) {
		throw new Error(`modulepreloadFilenames is undefined for ${name}`);
	}

	parentPort!.postMessage(modulepreloadFilenames);
};

const { name, sport, versionNumber } = workerData;

await buildFile(sport, name, versionNumber);
