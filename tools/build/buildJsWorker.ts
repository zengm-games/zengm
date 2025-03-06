import { rollup } from "rollup";
import rollupConfig from "../lib/rollupConfig.ts";
import { parentPort, workerData } from "node:worker_threads";

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
	const bundle = await rollup({
		...rollupConfig("production", {
			blacklistOptions: BLACKLIST[name],
			statsFilename: `stats-${name}.html`,
		}),
		input: {
			[name]: `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`,
		},
		preserveEntrySignatures: false,
	});

	// ES modules don't work in workers in all the browsers currently supported, otherwise could use "es" everywhere. Also at that point could evaluate things like code splitting in the worker, or code splitting between ui/worker bundles (building them together)
	// Safari 15
	const format = name === "ui" ? "es" : ("iife" as const);

	await bundle.write({
		compact: true,
		format,
		indent: false,
		sourcemap: true,
		entryFileNames: `[name]-${versionNumber}.js`,
		chunkFileNames: `chunk-[hash].js`,
		dir: "build/gen",
	});

	parentPort!.postMessage("done");
};

const { name, versionNumber } = workerData;

await buildFile(name, versionNumber);
