const fs = require("fs");
const rollup = require("rollup");
const { parentPort, workerData } = require("worker_threads");
const rollupConfig = require("./rollupConfig");

const { name } = workerData;

const file = `build/gen/${name}.js`;

const watcher = rollup.watch({
	...rollupConfig("development"),
	input: `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`,
	output: {
		name,
		file,
		format: "iife",
		indent: false,
		sourcemap: true,
	},
	treeshake: false,
});

watcher.on("event", event => {
	if (event.code === "START") {
		parentPort.postMessage({
			type: "start",
		});

		fs.writeFileSync(file, 'console.log("Bundling...")');
	} else if (event.code === "BUNDLE_END") {
		parentPort.postMessage({
			type: "end",
		});
	} else if (event.code === "ERROR" || event.code === "FATAL") {
		delete event.error.watchFiles;
		parentPort.postMessage({
			type: "error",
			error: event.error,
		});
		fs.writeFileSync(file, `console.error(${JSON.stringify(event.error)})`);
	}
});
