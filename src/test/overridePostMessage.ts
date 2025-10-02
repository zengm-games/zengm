export const overridePostMessage = () => {
	// Hack because promise-worker-bi 2.2.1 always sends back hostID, but the worker tests don't run in an actual worker, so
	// self.postMessage causes an error because it requires a different number of arguments inside and outside of a worker.
	const originalPostMessage = globalThis.postMessage;
	globalThis.postMessage = (...args) => {
		if (Array.isArray(args[0]) && JSON.stringify(args[0]) === "[2,-1,0]") {
			// Skip hostID message
		} else {
			// @ts-expect-error
			originalPostMessage(...args);
		}
	};
};
