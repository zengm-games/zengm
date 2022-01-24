import { IDBKeyRange } from "fake-indexeddb";
import fs from "fs";

// When mockIDBLeague is used, sometimes IDBKeyRange still gets called even though there is no actual database
global.IDBKeyRange = IDBKeyRange;

// Hack because promise-worker-bi 2.2.1 always sends back hostID, but the worker tests don't run in an actual worker, so
// self.postMessage causes an error because it requires a different number of arguments inside and outside of a worker.
const originalPostMessage = global.postMessage;
global.postMessage = (...args) => {
	if (
		// @ts-expect-error
		args.length === 1 &&
		Array.isArray(args[0]) &&
		JSON.stringify(args[0]) === "[2,-1,0]"
	) {
		// Skip hostID message
	} else {
		// @ts-expect-error
		originalPostMessage(...args);
	}
};

if (!process.env.SPORT) {
	process.env.SPORT = "basketball";
}

const fetchCache: Record<string, any> = {};
(global as any).fetch = async (url: string) => {
	if (!fetchCache.hasOwnProperty(url)) {
		let filePath = url.replace("/gen/", "data/");

		if (filePath.endsWith("real-player-data.json")) {
			filePath = filePath.replace(".json", `.${process.env.SPORT}.json`);
		}

		fetchCache[url] = JSON.parse(fs.readFileSync(filePath, "utf8"));
	}

	return {
		json: async () => fetchCache[url],
	};
};
