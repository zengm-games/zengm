import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { DraftLotteryResult, GetCopyType } from "../../../common/types";

const getCopies = async (
	{
		season,
	}: {
		season?: number;
	} = {},
	type?: GetCopyType,
): Promise<DraftLotteryResult[]> => {
	if (season !== undefined) {
		const draftLotteryResults = mergeByPk(
			await idb.league.getAll("draftLotteryResults", season),
			(await idb.cache.draftLotteryResults.getAll()).filter(event => {
				return event.season === season;
			}),
			"draftLotteryResults",
			type,
		);
		return draftLotteryResults;
	}

	return mergeByPk(
		await idb.league.getAll("draftLotteryResults"),
		await idb.cache.draftLotteryResults.getAll(),
		"draftLotteryResults",
		type,
	);
};

export default getCopies;
