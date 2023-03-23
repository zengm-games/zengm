import path from "node:path";
import { Worker } from "node:worker_threads";
import { getDirname } from "./getDirname.js";

const __dirname = getDirname(import.meta.url);

const watchJS = (updateStart, updateEnd, updateError) => {
	for (const name of ["ui", "worker"]) {
		const filename = `build/gen/${name}.js`;

		const worker = new Worker(path.join(__dirname, "watchJSWorker.js"), {
			workerData: {
				name,
			},
		});

		worker.on("message", message => {
			if (message.type === "start") {
				updateStart(filename);
			}
			if (message.type === "end") {
				updateEnd(filename);
			}
			if (message.type === "error") {
				updateError(filename, message.error);
			}
		});
	}
};

// watchJS((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));

export default watchJS;
