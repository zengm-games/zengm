const path = require("path");
const { Worker } = require("worker_threads");
const getSport = require("./getSport");

const watchJS = (updateStart, updateEnd, updateError) => {
	for (const name of ["ui", "worker"]) {
		const filename = `build/gen/${name}.js`;

		const worker = new Worker(path.join(__dirname, "watchJSWorker.js"), {
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

module.exports = watchJS;
