import { IDBKeyRange } from "fake-indexeddb";
import fs from "node:fs/promises";
import { overridePostMessage } from "./overridePostMessage.ts";

// When mockIDBLeague is used, sometimes IDBKeyRange still gets called even though there is no actual database
globalThis.IDBKeyRange = IDBKeyRange;

overridePostMessage();

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
(globalThis as any).location = {};
globalThis.addEventListener = () => {};
