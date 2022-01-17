import { idb } from "..";
import type { AllStars, GetCopyType } from "../../../common/types";

const getCopy = async (
	{
		season,
	}: {
		season: number;
	},
	type?: GetCopyType,
): Promise<AllStars | undefined> => {
	const result = await idb.getCopies.allStars(
		{
			season,
		},
		type,
	);
	return result[0];
};

export default getCopy;
