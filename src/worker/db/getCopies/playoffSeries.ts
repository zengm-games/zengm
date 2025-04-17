import { idb } from "../index.ts";
import { mergeByPk } from "./helpers.ts";
import type { GetCopyType, PlayoffSeries } from "../../../common/types.ts";

const getCopies = async (
	options: any = {},
	type?: GetCopyType,
): Promise<PlayoffSeries[]> => {
	return mergeByPk(
		await idb.league.getAll("playoffSeries"),
		await idb.cache.playoffSeries.getAll(),
		"playoffSeries",
		type,
	);
};

export default getCopies;
