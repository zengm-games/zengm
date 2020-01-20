import { idb } from "..";
import { mergeByPk } from "./helpers";
import { DraftLotteryResult } from "../../../common/types";

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
			idb.cache.storeInfos.draftLotteryResults.pk,
		);
		return draftLotteryResults;
	}

	return mergeByPk(
		await idb.league.getAll("draftLotteryResults"),
		await idb.cache.draftLotteryResults.getAll(),
		idb.cache.storeInfos.draftLotteryResults.pk,
	);
};

export default getCopies;
