import { wait } from "../../../common";
import { idb } from "../../db";
import { g } from "../../util";
import create from "./create";
import nextGameIsAllStar from "./nextGameIsAllStar";

let creatingAllStars = false;
const getOrCreate = async (season: number) => {
	if (season === g.get("season") && (await nextGameIsAllStar())) {
		let allStars = await idb.cache.allStars.get(season);

		// Race condition if this function is called twice at the same time, resulting in two All-Star awards being given per player, except for this lock check which will wait for the 1st one to finish
		let numTimesWaited = 0;
		while (!allStars && creatingAllStars && numTimesWaited < 10) {
			await wait(100);
			allStars = await idb.cache.allStars.get(season);
			numTimesWaited += 1;
		}

		if (!allStars) {
			creatingAllStars = true;
			try {
				allStars = await create({});
				await idb.cache.allStars.put(allStars);
				creatingAllStars = false;
			} catch (error) {
				creatingAllStars = false;
				throw error;
			}
		}

		return allStars;
	}

	const allStars = await idb.getCopy.allStars({ season }, "noCopyCache");
	return allStars;
};

export default getOrCreate;
