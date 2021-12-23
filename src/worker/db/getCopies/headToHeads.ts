import { idb } from "..";
import type { GetCopyType, HeadToHead } from "../../../common/types";
import { mergeByPk } from "./helpers";

const getCopies = async (
	{
		season,
	}: {
		season?: number;
	} = {},
	type?: GetCopyType,
): Promise<HeadToHead[]> => {
	if (season !== undefined) {
		const headToHeads = mergeByPk(
			await idb.league.getAll("headToHeads", season),
			(await idb.cache.headToHeads.getAll()).filter(event => {
				return event.season === season;
			}),
			"headToHeads",
			type,
		);
		return headToHeads;
	}

	return mergeByPk(
		await idb.league.getAll("headToHeads"),
		await idb.cache.headToHeads.getAll(),
		"headToHeads",
		type,
	);
};

export default getCopies;
