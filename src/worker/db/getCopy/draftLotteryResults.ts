import { idb } from "..";
import type { DraftLotteryResult } from "../../../common/types";

const getCopy = async ({
	season,
}: {
	season: number;
}): Promise<DraftLotteryResult | void> => {
	const result = await idb.getCopies.draftLotteryResults({
		season,
	});
	return result[0];
};

export default getCopy;
