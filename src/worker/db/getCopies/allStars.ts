import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { AllStars, GetCopyType } from "../../../common/types";

const getCopies = async (
	{
		season,
	}: {
		season?: number;
	} = {},
	type?: GetCopyType,
): Promise<AllStars[]> => {
	if (season !== undefined) {
		const awards = mergeByPk(
			await idb.league.getAll("allStars", season),
			(await idb.cache.allStars.getAll()).filter(row => {
				return row.season === season;
			}),
			"allStars",
			type,
		);
		return awards;
	}

	return mergeByPk(
		await idb.league.getAll("allStars"),
		await idb.cache.allStars.getAll(),
		"allStars",
		type,
	);
};

export default getCopies;
