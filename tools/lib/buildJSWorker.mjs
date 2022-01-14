import * as rollup from "rollup";
import rollupConfig from "./rollupConfig.js";
import { parentPort, workerData } from "worker_threads";

const LODASH_BLACKLIST = [
	/^lodash$/,
	/^lodash-es$/,

	// lodash/debound and lodash/memoize are used by visx
	/^lodash\/(?!debounce|memoize)/,
];

const BLACKLIST = {
	ui: [...LODASH_BLACKLIST, /\/worker/],
	worker: [...LODASH_BLACKLIST, /\/ui/, /^react/],
};

const buildFile = async (name, legacy, rev) => {
	const bundle = await rollup.rollup({
		...rollupConfig("production", {
			blacklistOptions: BLACKLIST[name],
			statsFilename: `stats-${name}.html`,
			legacy,
		}),
		input: {
			[name]: `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`,
		},
		preserveEntrySignatures: false,
	});

	let format;
	if (legacy) {
		// SystemJS for chunk loading in UI. IIFE for worker.
		format = name === "ui" ? "system" : "iife";
	} else {
		format = "es";
	}

	await bundle.write({
		compact: true,
		format,
		indent: false,
		sourcemap: true,
		entryFileNames: `[name]-${legacy ? "legacy-" : ""}${rev}.js`,
		chunkFileNames: `chunk-${legacy ? "legacy-" : ""}[hash].js`,
		dir: "build/gen",
	});

	parentPort.postMessage("done");
};

(async () => {
	const { legacy, name, rev } = workerData;

	await buildFile(name, legacy, rev);
})();
