import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { AllStars } from "../../../common/types";

const getCopies = async ({
	season,
}: {
	season?: number;
} = {}): Promise<AllStars[]> => {
	if (season !== undefined) {
		const awards = mergeByPk(
			await idb.league.getAll("allStars", season),
			(await idb.cache.allStars.getAll()).filter(row => {
				return row.season === season;
			}),
			"allStars",
		);
		return awards;
	}

	return mergeByPk(
		await idb.league.getAll("allStars"),
		await idb.cache.allStars.getAll(),
		"allStars",
	);
};

export default getCopies;
