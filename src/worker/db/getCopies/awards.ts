import { idb } from "..";
import type { GetCopyType } from "../../../common/types";
import { mergeByPk } from "./helpers";

const getCopies = async (
	{
		season,
	}: {
		season?: number;
	} = {},
	type?: GetCopyType,
): Promise<any[]> => {
	if (season !== undefined) {
		const awards = mergeByPk(
			await idb.league.getAll("awards", season),
			(await idb.cache.awards.getAll()).filter(event => {
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
