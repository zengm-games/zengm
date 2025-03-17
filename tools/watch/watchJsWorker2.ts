import { parentPort, workerData } from "node:worker_threads";
import { watch } from "rolldown";
import { rolldownConfig } from "../lib/rolldownConfig.ts";

// ?? is just so this can be run as a standalone script, for testing
const name = workerData?.name ?? "worker";

const config = rolldownConfig(name, {
	nodeEnv: "development",
	postMessage(message: any) {
		parentPort?.postMessage(message);
	},
});

await watch(config);
