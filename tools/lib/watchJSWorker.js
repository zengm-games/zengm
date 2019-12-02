const fs = require("fs");
const rollup = require("rollup");
const { parentPort, workerData } = require("worker_threads"); // eslint-disable-line
const rollupConfig = require("./rollupConfig");

const { name, sport } = workerData;

const file = `build/gen/${name}.js`;

const watcher = rollup.watch({
	...rollupConfig("development"),
	input: `src/${sport}/${name}/index.js`,
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
		console.log(event.error);
		fs.writeFileSync(file, `console.error(${JSON.stringify(event.error)})`);
	}
});
