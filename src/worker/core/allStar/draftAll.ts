import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import draftOne from "./draftOne.ts";

const draftAll = async (): Promise<number[]> => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	if (!allStars) {
		throw new Error("allStars not found");
	}

	const pids: number[] = [];

	while (!allStars.finalized) {
		const { pid } = await draftOne(true);

		if (pid === undefined) {
			break;
		}

		pids.push(pid);
	}

	return pids;
};

export default draftAll;
