import { idb } from "../../db";
import { g } from "../../util";
import create from "./create";
import nextGameIsAllStar from "./nextGameIsAllStar";

const getOrCreate = async (season: number) => {
	if (season === g.get("season") && (await nextGameIsAllStar())) {
		let allStars = await idb.cache.allStars.get(g.get("season"));

		if (!allStars) {
			allStars = await create({});
			await idb.cache.allStars.put(allStars);
		}

		return allStars;
	}

	const allStars = await idb.getCopy.allStars({ season }, "noCopyCache");
	return allStars;
};

export default getOrCreate;
