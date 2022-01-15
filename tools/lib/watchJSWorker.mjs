import esbuild from "esbuild";
import fs from "fs";
import { parentPort, workerData } from "worker_threads";
import esbuildConfig from "./esbuildConfig.mjs";

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

				// Save to file so it appears when reloading page
				const js = `throw new Error(\`${error.message}\`)`;
				fs.writeFileSync(config.outfile, js);
			}
		},
	},
});
