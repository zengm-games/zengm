import { rollup, type ModuleFormat } from "rollup";
import rollupConfig from "./rollupConfig.ts";
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

const buildFile = async (
	name: "ui" | "worker",
	legacy: boolean,
	rev: string,
) => {
	const bundle = await rollup({
		...rollupConfig("production", {
			blacklistOptions: BLACKLIST[name],
			statsFilename: `stats-${name}${legacy ? "-legacy" : ""}.html`,
			legacy,
		}),
		input: {
			[name]: `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`,
		},
		preserveEntrySignatures: false,
	});

	let format: ModuleFormat;
	if (legacy) {
		// ES modules don't work in workers in all the browsers currently supported
		// Chrome 80, Firefox 114, Safari 15.5/16.4
		format = name === "ui" ? "es" : "iife";
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

	parentPort!.postMessage("done");
};

const { legacy, name, rev } = workerData;

await buildFile(name, legacy, rev);
