import { idb } from "../../db/index.ts";
import create from "./create.ts";

const get = async (pid: number) => {
	// Re-signing is in DB
	let negotiation = await idb.cache.negotiations.get(pid);

	if (!negotiation) {
		// Free agent is not in DB
		const info = await create(pid, false);
		if (typeof info === "string") {
			return info;
		}

		negotiation = info;
	}

	return negotiation;
};

export default get;
