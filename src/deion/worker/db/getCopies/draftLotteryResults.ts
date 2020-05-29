import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { DraftLotteryResult } from "../../../common/types";

const getCopies = async ({
	season,
}: {
	season?: number;
} = {}): Promise<DraftLotteryResult[]> => {
	if (season !== undefined) {
		const draftLotteryResults = mergeByPk(
			await idb.league.getAll("draftLotteryResults", season),
			(await idb.cache.draftLotteryResults.getAll()).filter(event => {
				return event.season === season;
			}),
			"draftLotteryResults",
		);
		return draftLotteryResults;
	}

	return mergeByPk(
		await idb.league.getAll("draftLotteryResults"),
		await idb.cache.draftLotteryResults.getAll(),
		"draftLotteryResults",
	);
};

export default getCopies;
