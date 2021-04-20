const { parentPort, workerData } = require("worker_threads");
const esbuild = require("esbuild");
const esbuildConfig = require("./esbuildConfig");

// No built-in way to identify when a rebuild starts, so do this
const pluginStartTime = infile => {
	const filter = new RegExp(infile.replace(".", "\\."));
	return {
		name: "start-time",
		setup(build) {
			build.onResolve({ filter, namespace: "file" }, () => {
				parentPort.postMessage({
					type: "start",
				});
			});
		},
	};
};

(async () => {
	const { name } = workerData;

	const config = esbuildConfig({
		name,
		nodeEnv: "development",
	});

	config.plugins.push(pluginStartTime(config.entryPoints[0]));

	await esbuild.build({
		...config,
		watch: {
			onRebuild(error) {
				if (error) {
					parentPort.postMessage({
						type: "error",
						error,
					});
				} else {
					parentPort.postMessage({
						type: "end",
					});
				}
			},
		},
	});

	parentPort.postMessage({
		type: "end",
	});
})();
