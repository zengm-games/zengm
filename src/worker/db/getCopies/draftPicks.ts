import orderBy from "lodash-es/orderBy";
import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { DraftPick, GetCopyType } from "../../../common/types";

const getCopies = async (
	{
		tid,
	}: {
		tid?: number;
	} = {},
	type?: GetCopyType,
): Promise<DraftPick[]> => {
	let draftPicks;

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
