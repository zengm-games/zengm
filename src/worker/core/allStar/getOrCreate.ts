import { idb } from "../../db";
import { g } from "../../util";
import create from "./create";

const getOrCreate = async () => {
	let allStars = await idb.cache.allStars.get(g.get("season"));

	if (!allStars) {
		allStars = await create({});
		await idb.cache.allStars.put(allStars);
	}

	return allStars;
};

export default getOrCreate;
