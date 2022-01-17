import { idb } from "..";
import type { GetCopyType } from "../../../common/types";

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
