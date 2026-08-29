import { idb } from "../index.ts";
import type { Awards, GetCopyType } from "../../../common/types.ts";
import { mergeByPk } from "./helpers.ts";

const getCopies = async (
	{
		season,
	}: {
		season?: number;
	} = {},
	type?: GetCopyType,
): Promise<Awards[]> => {
	if (season !== undefined) {
		const awards = mergeByPk(
			await idb.league.getAll("awards", season),
			(await idb.cache.awards.getAll()).filter((event) => {
				return event.season === season;
			}),
			"awards",
			type,
		);
		return awards;
	}

	return mergeByPk(
		await idb.league.getAll("awards"),
		await idb.cache.awards.getAll(),
		"awards",
		type,
	);
};

export default getCopies;
