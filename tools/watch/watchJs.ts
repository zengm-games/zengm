import { Worker } from "node:worker_threads";

const exitHandler = () => {
	process.exit(130);
};
process.once("SIGINT", exitHandler);

const worker = new Worker(new URL("watchJsWorker.ts", import.meta.url));

worker.on("message", (message) => {
	console.log(message);
});
