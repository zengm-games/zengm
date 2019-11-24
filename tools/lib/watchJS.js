const path = require("path");
const { Worker } = require("worker_threads");
const getSport = require("./getSport");

const watchJS = () => {
	for (const name of ["ui", "worker"]) {
		// eslint-disable-next-line
		new Worker(path.join(__dirname, "watchJSWorker.js"), {
			workerData: {
				name,
				sport: getSport(),
			},
		});
	}
};

module.exports = watchJS;
