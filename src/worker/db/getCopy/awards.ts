import { idb } from "../index.ts";
import type { GetCopyType } from "../../../common/types.ts";

const getCopy = async (
	{
		season,
	}: {
		season: number;
	},
	type?: GetCopyType,
): Promise<any | undefined> => {
	const result = await idb.getCopies.awards(
		{
			season,
		},
		type,
	);
	return result[0];
};

export default getCopy;
