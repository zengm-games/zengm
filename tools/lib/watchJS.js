const fs = require("fs");
const rollup = require("rollup");
const build = require("./buildFuncs");
const rollupConfig = require("./rollupConfig");

const watchJS = () => {
	console.log("Watching JavaScript files...");

	const sport = build.getSport();

	// Could pass an array to rollup.watch, but that seems to make it bundle in series rather than parallel
	for (const name of ["ui", "worker"]) {
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
				fs.writeFileSync(file, 'console.log("Bundling...")');
			} else if (event.code === "BUNDLE_END") {
				const { size } = fs.statSync(file);
				console.log(
					`${(size / 1024 / 1024).toFixed(2)} MB written to ${file} (${(
						event.duration / 1000
					).toFixed(2)} seconds) at ${new Date().toLocaleTimeString()}`,
				);
			} else if (event.code === "ERROR" || event.code === "FATAL") {
				delete event.error.watchFiles;
				console.log(event.error);
				fs.writeFileSync(file, `console.error(${JSON.stringify(event.error)})`);
			}
		});
	}
};

module.exports = watchJS;
