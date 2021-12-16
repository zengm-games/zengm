import { idb } from "..";
import type { DraftLotteryResult, GetCopyType } from "../../../common/types";

const getCopy = async (
	{
		season,
	}: {
		season: number;
	},
	type?: GetCopyType,
): Promise<DraftLotteryResult | void> => {
	const result = await idb.getCopies.draftLotteryResults(
		{
			season,
		},
		type,
	);
	return result[0];
};

export default getCopy;
