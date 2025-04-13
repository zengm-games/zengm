import { idb } from "../index.ts";
import { mergeByPk } from "./helpers.ts";
import type { DraftPick, GetCopyType } from "../../../common/types.ts";
import { orderBy } from "../../../common/utils.ts";

const getCopies = async (
	{
		note,
		tid,
	}: {
		note?: boolean;
		tid?: number;
	} = {},
	type?: GetCopyType,
): Promise<DraftPick[]> => {
	let draftPicks;

	if (note) {
		return mergeByPk(
			[], // All picks always in cache
			await idb.cache.draftPicks.getAll(),
			"draftPicks",
			type,
		).filter((row) => row.noteBool === 1);
	}

	if (tid !== undefined) {
		draftPicks = mergeByPk(
			[], // All picks always in cache
			await idb.cache.draftPicks.indexGetAll("draftPicksByTid", tid),
			"draftPicks",
			type,
		);
	} else {
		draftPicks = mergeByPk(
			[], // All picks always in cache
			await idb.cache.draftPicks.getAll(),
			"draftPicks",
			type,
		);
	}

	return orderBy(draftPicks, ["season", "round", "pick", "originalTid"]);
};

export default getCopies;
