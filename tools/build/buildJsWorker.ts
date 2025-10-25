import { build } from "rolldown";
import { rollup } from "rollup";
import rollupConfig from "../lib/rollupConfig.ts";
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
	if (process.env.BUNDLER === "rollup") {
		if (name === "ui") {
			console.log("Bundler: rollup");
		}
		const config = rollupConfig(name, {
			nodeEnv: "production",
			blacklistOptions: BLACKLIST[name],
		});
		const bundle = await rollup(config);

		await bundle.write({
			compact: true,
			format: "es",
			indent: false,
			sourcemap: true,
			externalLiveBindings: false,
			entryFileNames: `[name]-${versionNumber}.js`,
			chunkFileNames: `chunk-[hash].js`,
			dir: "build/gen",
		});

		await bundle.close();
	} else {
		if (name === "ui") {
			console.log("Bundler: rolldown");
		}
		const config = rolldownConfig(name, {
			nodeEnv: "production",
			blacklistOptions: BLACKLIST[name],
			versionNumber,
		});
		await build(config);
	}

	parentPort!.postMessage("done");
};

const { name, versionNumber } = workerData;

await buildFile(name, versionNumber);
