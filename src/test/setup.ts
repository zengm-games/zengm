import { IDBKeyRange } from "fake-indexeddb";
import fs from "node:fs/promises";

// When mockIDBLeague is used, sometimes IDBKeyRange still gets called even though there is no actual database
globalThis.IDBKeyRange = IDBKeyRange;

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

const fetchCache: Record<string, any> = {};
(globalThis as any).fetch = async (url: string) => {
	if (!Object.hasOwn(fetchCache, url)) {
		let filePath = url.replace("/gen/", "data/");

		if (filePath.endsWith("real-player-data.json")) {
			filePath = filePath.replace(".json", `.${process.env.SPORT}.json`);
		}

		fetchCache[url] = JSON.parse(await fs.readFile(filePath, "utf8"));
	}

	return {
		json: async () => fetchCache[url],
	};
};

// Removes the need for jsdom in most test files
(globalThis as any).self = globalThis;
(globalThis as any).window = globalThis;
globalThis.addEventListener = () => {};
