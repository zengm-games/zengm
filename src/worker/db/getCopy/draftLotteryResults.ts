import { idb } from "../index.ts";
import type { DraftLotteryResult, GetCopyType } from "../../../common/types.ts";

const getCopy = async (
	{
		season,
	}: {
		season: number;
	},
	type?: GetCopyType,
): Promise<DraftLotteryResult | undefined> => {
	const result = await idb.getCopies.draftLotteryResults(
		{
			season,
		},
		type,
	);
	return result[0];
};

export default getCopy;
