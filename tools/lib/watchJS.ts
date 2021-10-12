import path from "path";
import { Worker } from "worker_threads";
import getSport from "./getSport.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const watchJS = (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	for (const name of ["ui", "worker"]) {
		const filename = `build/gen/${name}.js`;

		const worker = new Worker(path.join(__dirname, "watchJSWorker.ts"), {
			workerData: {
				name,
				sport: getSport(),
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
