const { parentPort, workerData } = require("worker_threads");
const esbuild = require("esbuild");
const esbuildConfig = require("./esbuildConfig");

const pluginStartEnd = {
	name: "start-end",
	setup(build) {
		build.onStart(() => {
			parentPort.postMessage({
				type: "start",
			});
		});
		build.onEnd(() => {
			parentPort.postMessage({
				type: "end",
			});
		});
	},
};

(async () => {
	const { name } = workerData;

	const config = esbuildConfig({
		name,
		nodeEnv: "development",
	});

	config.plugins.push(pluginStartEnd);

	await esbuild.build({
		...config,
		watch: {
			onRebuild(error) {
				if (error) {
					parentPort.postMessage({
						type: "error",
						error,
					});
				}
			},
		},
	});
})();
