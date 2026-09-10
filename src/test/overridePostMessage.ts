export const overridePostMessage = () => {
	// Hack because promise-worker-bi always sends back hostID, but the worker tests don't run in an actual worker, so
	// self.postMessage causes an error because it requires a different number of arguments inside and outside of a worker.
	const originalPostMessage = globalThis.postMessage;
	globalThis.postMessage = (...args) => {
		const arg = args[0];
		if (
			Array.isArray(arg) &&
			((arg[0] === 4 && arg.length === 2) || JSON.stringify(arg) === "[2,0]")
		) {
			// Skip MSGTYPE_HOST_ID and MSGTYPE_WORKER_LOCK
		} else {
			// @ts-expect-error
			originalPostMessage(...args);
		}
	};
};
